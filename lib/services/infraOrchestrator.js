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
      console.log(
        `[InfraOrchestrator] Droplet Info: ${info.name} (${info.vcpus} vCPUs, ${info.memory}MB RAM)`
      );

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

      // 7. Store in Cache (Make available to UI)
      await redis.set(this.cacheKey, JSON.stringify(liveState), "EX", 120);

      // 8. Update DB (Local state management)
      try {
        await this.updateNodeStats(liveState, info);
      } catch (dbErr) {
        console.error(
          "[InfraOrchestrator] Failed to update Node DB:",
          dbErr.message
        );
      }

      this.emit("infra.update", liveState);
    } catch (error) {
      console.error("[InfraOrchestrator] Poll error:", error.message);
    }
  }

  normalizeMetrics(metrics, info, botStats = []) {
    // DO Metrics come in as arrays of points [timestamp, value]
    const getLatestValue = (result, labelFilters = {}) => {
      if (!result || !Array.isArray(result) || result.length === 0) return 0;

      // If we have filters, find the matching series
      const series =
        result.find((s) =>
          Object.entries(labelFilters).every(([k, v]) => s.metric[k] === v)
        ) || result[0];

      const val = series.values?.slice(-1)[0]?.[1];
      return val ? parseFloat(val) : 0;
    };

    let usedMemoryBytes = 0;
    let cpuUsage = 0;
    let usedDiskBytes = 0;

    const totalMemoryMB = info.memory;
    const totalMemoryBytes = totalMemoryMB * 1024 * 1024;
    const totalDiskGB = info.disk;
    const totalDiskBytes = totalDiskGB * 1024 * 1024 * 1024;

    if (metrics && (metrics.cpu || metrics.memory || metrics.filesystem)) {
      // 1. CPU: Total 100% minus the idle percentage
      const idlePercent = getLatestValue(metrics.cpu, { mode: "idle" });
      cpuUsage = Math.max(0, 100 - idlePercent);

      // If idle seems missing or weird (e.g. 0), fall back to summing other modes
      if (idlePercent === 0) {
        cpuUsage = metrics.cpu.reduce((acc, s) => {
          if (s.metric.mode === "idle") return acc;
          const v = s.values?.slice(-1)[0]?.[1];
          return acc + (v ? parseFloat(v) : 0);
        }, 0);
      }

      // 2. Memory: Handle available vs used
      const memVal = getLatestValue(metrics.memory) || 0;
      if (
        metrics.memoryType === "memory_available" ||
        metrics.memoryType === "memory_free"
      ) {
        usedMemoryBytes = Math.max(0, totalMemoryBytes - memVal);
      } else {
        usedMemoryBytes = memVal;
      }

      // 3. Disk
      const filesystemFree = getLatestValue(metrics.filesystem) || 0;
      usedDiskBytes = Math.max(0, totalDiskBytes - filesystemFree);

      console.log(
        `[InfraOrchestrator] Normalized: CPU=${cpuUsage.toFixed(2)}%, RAM=${(
          usedMemoryBytes /
          1024 /
          1024
        ).toFixed(2)}MB, Disk=${(usedDiskBytes / 1024 / 1024 / 1024).toFixed(
          2
        )}GB`
      );
    } else {
      // Pterodactyl Fallback
      usedMemoryBytes = botStats.reduce(
        (acc, bot) => acc + bot.usedRam * 1024 * 1024,
        0
      );
      usedDiskBytes = botStats.reduce(
        (acc, bot) => acc + bot.usedDisk * 1024 * 1024,
        0
      );
      cpuUsage = botStats.reduce((acc, bot) => acc + bot.usedCpu, 0);
      console.log(
        `[InfraOrchestrator] Using Pterodactyl Fallback (Bots summing)`
      );
    }

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
          usedPercent: Math.min(100, Math.round(cpuUsage * 100) / 100) || 0,
          cores: info.vcpus || 1,
        },
        memory: {
          totalMB: totalMemoryMB || 1024,
          usedMB: usedMemoryMB || 0,
          usedPercent:
            Math.min(
              100,
              Math.round((usedMemoryBytes / (totalMemoryBytes || 1)) * 100)
            ) || 0,
          breakdown: {
            botsMB: botRamUsageMB || 0,
            systemMB: systemOverheadMB || 0,
          },
        },
        disk: {
          totalGB: totalDiskGB || 25,
          usedGB: Math.round(usedDiskBytes / 1024 / 1024 / 1024) || 0,
          usedPercent:
            Math.min(
              100,
              Math.round((usedDiskBytes / (totalDiskBytes || 1)) * 100)
            ) || 0,
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
      const deployments = await Deployment.find({
        pterodactylUuid: { $exists: true, $ne: null },
      }).populate("user", "username email");

      return deployments.map((d) => ({
        id: d._id,
        name: d.botName,
        user: d.user ? d.user.username : "Unknown",
        userId: d.user ? d.user._id : null,
        status: d.status,
        usedRam: d.resources?.usedRam || 0, // Already in MB
        usedCpu: d.resources?.usedCpu || 0,
        usedDisk: d.resources?.usedDisk || 0, // Already in MB
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

      // Ensure required schema fields
      this._ensureNodeResources(node, info);

      await node.save();
    }
  }

  _ensureNodeResources(node, info) {
    if (!node.resources) node.resources = {};
    if (!node.resources.totalRam) node.resources.totalRam = info.memory || 1024;
    if (!node.resources.totalCpu)
      node.resources.totalCpu = (info.vcpus || 1) * 100;
    if (!node.resources.totalDisk)
      node.resources.totalDisk = (info.disk || 25) * 1024;
  }

  async updateNodeStats(liveState, info) {
    let node = await Node.findOne({
      $or: [{ name: info.name }, { fqdn: info.name }],
    });

    if (!node) node = await Node.findOne({});

    if (node) {
      node.status = liveState.status === "active" ? "online" : "offline";
      node.resources.usedRam = liveState.host.memory.usedMB;
      node.resources.usedCpu = liveState.host.cpu.usedPercent;
      node.resources.usedDisk = liveState.host.disk.usedGB * 1024; // MB

      // Sync total resources too to ensure they are never missing
      this._ensureNodeResources(node, info);

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
