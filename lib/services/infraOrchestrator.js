const EventEmitter = require("events");
const digitalOcean = require("../utils/digitalOcean");
const redis = require("../utils/redis");
const Node = require("../../models/Node");
const pterodactyl = require("../utils/pterodactyl");

class InfrastructureOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.pollInterval = 60000; // 1 minute
    this.timer = null;
    this.cacheKey = "infra:live_state";
  }

  async start() {
    console.log("[InfraOrchestrator] Starting infrastructure monitoring...");
    this.timer = setInterval(() => this.poll(), this.pollInterval);
    // Trigger initial poll
    this.poll();
  }

  async poll() {
    try {
      const dropletId = process.env.DIGITALOCEAN_DROPLET_ID;
      if (!dropletId) return;

      console.log(`[InfraOrchestrator] Polling droplet ${dropletId}...`);

      const [metrics, info] = await Promise.all([
        digitalOcean.getDropletMetrics(dropletId),
        digitalOcean.getDropletInfo(dropletId),
      ]);

      // Normalize Metrics
      const liveState = this.normalizeMetrics(metrics, info);

      // Store in Redis for high-frequency dashboard access
      await redis.set(this.cacheKey, JSON.stringify(liveState), "EX", 120);

      // Persist to MongoDB Node model (Update the node that corresponds to this droplet)
      // Assuming DO droplet maps to a Node in Pterodactyl/Local DB
      await this.updateNodeStats(liveState, info);

      this.emit("infra.update", liveState);
    } catch (error) {
      console.error("[InfraOrchestrator] Poll error:", error.message);
    }
  }

  normalizeMetrics(metrics, info) {
    // DO Metrics come in as arrays of points [timestamp, value]
    // Extract last point
    const getLatest = (arr) => arr?.[0]?.values?.slice(-1)[0]?.[1] || 0;

    const usedMemoryBytes = parseFloat(getLatest(metrics.memory)) || 0;
    const totalMemoryMB = info.memory; // in MB
    const totalMemoryBytes = totalMemoryMB * 1024 * 1024;

    const filesystemFree = parseFloat(getLatest(metrics.filesystem)) || 0;
    const totalDiskGB = info.disk;
    const totalDiskBytes = totalDiskGB * 1024 * 1024 * 1024;
    const usedDiskBytes = totalDiskBytes - filesystemFree;

    const cpuUsage = parseFloat(getLatest(metrics.cpu)) * 100; // Convert to %

    return {
      timestamp: new Date(),
      dropletId: info.id,
      name: info.name,
      status: info.status,
      host: {
        cpu: {
          usedPercent: Math.round(cpuUsage * 100) / 100,
          cores: info.vcpus,
        },
        memory: {
          totalMB: totalMemoryMB,
          usedMB: Math.round(usedMemoryBytes / 1024 / 1024),
          usedPercent: Math.round((usedMemoryBytes / totalMemoryBytes) * 100),
        },
        disk: {
          totalGB: totalDiskGB,
          usedGB: Math.round(usedDiskBytes / 1024 / 1024 / 1024),
          usedPercent: Math.round((usedDiskBytes / totalDiskBytes) * 100),
        },
      },
      capacity: {
        safeThresholdMet: usedMemoryBytes / totalMemoryBytes < 0.85,
        remainingRamMB: Math.round(
          (totalMemoryBytes - usedMemoryBytes) / 1024 / 1024
        ),
      },
    };
  }

  async updateNodeStats(liveState, info) {
    // Find the node by FQDN or name (usually DO droplet name is Ptero node FQDN or Name)
    // Here we'll try to find any node that matches the droplet name if possible,
    // or just update the primary node.
    let node = await Node.findOne({
      $or: [{ name: info.name }, { fqdn: info.name }],
    });

    if (!node) {
      // If not found, look for node with matching resource profile or just use first one
      node = await Node.findOne({});
    }

    if (node) {
      node.status = liveState.status === "active" ? "online" : "offline";
      node.resources.usedRam = liveState.host.memory.usedMB;
      node.resources.usedCpu = liveState.host.cpu.usedPercent;
      node.resources.usedDisk = liveState.host.disk.usedGB * 1024; // MB
      node.lastHeartbeat = new Date();
      await node.save();
    }
  }

  async getLiveState() {
    const cached = await redis.get(this.cacheKey);
    return cached ? JSON.parse(cached) : null;
  }
}

module.exports = new InfrastructureOrchestrator();
