const EventEmitter = require("events");
const digitalOcean = require("../utils/digitalOcean");
const redis = require("../utils/redis");
const Node = require("../../models/Node");
const User = require("../../models/User");
const Deployment = require("../../models/Deployment");
const pterodactyl = require("../utils/pterodactyl");
const alertingService = require("./alertingService");

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

      // 1. Get Droplet basic info first (this usually works even without agent)
      const info = await digitalOcean.getDropletInfo(dropletId);

      // 2. Try to get metrics
      let metrics = null;
      try {
        metrics = await digitalOcean.getDropletMetrics(dropletId);
      } catch (metricsErr) {
        if (metricsErr.response?.status === 404) {
          console.warn(
            `[InfraOrchestrator] Monitoring stats not ready yet for ${info.name}. Ensure agent is running and droplet has been restarted.`
          );
        } else {
          throw metricsErr;
        }
      }

      // 4. Get Per-Bot Metrics (Attribution)
      const botStats = await this.fetchBotMetrics();

      // 5. Normalize and Store
      // If we don't have DO metrics, we can still generate a partial liveState with info and bot stats
      const liveState = this.normalizeMetrics(metrics, info, botStats);

      // 6. Alerting & Prediction
      await alertingService.processHostMetrics(liveState);
      await alertingService.processBotMetrics(botStats);
      liveState.prediction = await this.calculateCapacityTrend(liveState);

      await redis.set(this.cacheKey, JSON.stringify(liveState), "EX", 120);
      await this.updateNodeStats(liveState, info);

      this.emit("infra.update", liveState);
    } catch (error) {
      console.error("[InfraOrchestrator] Poll error:", error.message);
    }
  }

  normalizeMetrics(metrics, info, botStats = []) {
    // DO Metrics come in as arrays of points [timestamp, value]
    const getLatest = (arr) => arr?.[0]?.values?.slice(-1)[0]?.[1] || 0;

    let usedMemoryBytes = 0;
    let cpuUsage = 0;
    let usedDiskBytes = 0;

    if (metrics) {
      usedMemoryBytes = parseFloat(getLatest(metrics.memory)) || 0;
      const filesystemFree = parseFloat(getLatest(metrics.filesystem)) || 0;
      const totalDiskBytes = info.disk * 1024 * 1024 * 1024;
      usedDiskBytes = Math.max(0, totalDiskBytes - filesystemFree);
      cpuUsage = parseFloat(getLatest(metrics.cpu)) * 100;
    }

    const totalMemoryMB = info.memory;
    const totalMemoryBytes = totalMemoryMB * 1024 * 1024;
    const usedMemoryMB = Math.round(usedMemoryBytes / 1024 / 1024);

    // Attribute RAM usage
    const botRamUsageMB = botStats.reduce((acc, bot) => acc + bot.usedRam, 0);
    const systemOverheadMB = Math.max(0, usedMemoryMB - botRamUsageMB);

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
          usedMB: usedMemoryMB,
          usedPercent: Math.round((usedMemoryBytes / totalMemoryBytes) * 100),
          breakdown: {
            botsMB: botRamUsageMB,
            systemMB: systemOverheadMB,
          },
        },
        disk: {
          totalGB: totalDiskGB,
          usedGB: Math.round(usedDiskBytes / 1024 / 1024 / 1024),
          usedPercent: Math.round((usedDiskBytes / totalDiskBytes) * 100),
        },
      },
      bots: botStats,
      capacity: {
        safeThresholdMet: usedMemoryBytes / totalMemoryBytes < 0.85,
        remainingRamMB: Math.round(
          (totalMemoryBytes - usedMemoryBytes) / 1024 / 1024
        ),
        botCount: botStats.length,
      },
    };
  }

  async fetchBotMetrics() {
    try {
      // Find all active deployments
      const deployments = await Deployment.find({
        isActive: true,
        pterodactylUuid: { $exists: true, $ne: null },
      }).populate("user", "username email");

      return deployments.map((d) => ({
        id: d._id,
        name: d.botName,
        user: d.user ? d.user.username : "Unknown",
        userId: d.user ? d.user._id : null,
        status: d.status,
        usedRam: Math.round((d.resources?.usedRam || 0) / 1024 / 1024), // Bytes to MB
        usedCpu: d.resources?.usedCpu || 0,
        usedDisk: Math.round((d.resources?.usedDisk || 0) / 1024 / 1024),
        limitRam: d.resources?.ramLimit || 0,
        state: d.resources?.state || "unknown",
      }));
    } catch (error) {
      console.error("[InfraOrchestrator] Error fetching bot metrics:", error);
      return [];
    }
  }

  async updateNodeStatusOnly(info) {
    let node = await Node.findOne({
      $or: [{ name: info.name }, { fqdn: info.name }],
    });
    if (!node) node = await Node.findOne({});

    if (node) {
      node.status = info.status === "active" ? "online" : "offline";
      node.lastHeartbeat = new Date();

      // Auto-populate required schema fields from droplet hardware info
      if (!node.resources.totalRam) node.resources.totalRam = info.memory;
      if (!node.resources.totalCpu) node.resources.totalCpu = info.vcpus * 100;
      if (!node.resources.totalDisk)
        node.resources.totalDisk = info.disk * 1024; // Convert GB to MB

      await node.save();
      console.log(
        `[InfraOrchestrator] Updated node ${node.name} status to ${node.status} (Metrics pending)`
      );
    }
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

  async calculateCapacityTrend(liveState) {
    try {
      const historyKey = "infra:history:ram";
      const now = Date.now();
      const currentUsed = liveState.host.memory.usedMB;

      // Store current point in a Redis list (keep last 24 entries)
      await redis.lpush(historyKey, JSON.stringify({ t: now, v: currentUsed }));
      await redis.ltrim(historyKey, 0, 23);

      const historyLines = await redis.lrange(historyKey, 0, -1);
      if (historyLines.length < 2) return { status: "calculating" };

      const points = historyLines.map((l) => JSON.parse(l));
      const first = points[points.length - 1];
      const last = points[0];

      const timeDiffHours = (last.t - first.t) / (1000 * 60 * 60);
      const usageDiff = last.v - first.v;

      if (timeDiffHours <= 0) return { status: "calculating" };

      const consumptionRatePerHour = usageDiff / timeDiffHours;
      const remainingRam = liveState.host.memory.totalMB - currentUsed;

      if (consumptionRatePerHour <= 0) {
        return { status: "stable", rateMBPerHour: 0 };
      }

      const hoursToLimit = remainingRam / consumptionRatePerHour;

      return {
        status:
          hoursToLimit < 24
            ? "critical"
            : hoursToLimit < 72
            ? "warning"
            : "healthy",
        consumptionRateMBPerHour:
          Math.round(consumptionRatePerHour * 100) / 100,
        predictedHoursToLimit: Math.round(hoursToLimit),
        upgradeUrgency:
          hoursToLimit < 24
            ? "IMMEDIATE"
            : hoursToLimit < 168
            ? "PLAN_UPGRADE"
            : "NONE",
      };
    } catch (error) {
      return { status: "error", message: error.message };
    }
  }
}

module.exports = new InfrastructureOrchestrator();
