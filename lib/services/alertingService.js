const Notification = require("../../models/Notification");

class AlertingService {
  constructor() {
    this.activeAlerts = new Map();
  }

  async processHostMetrics(liveState) {
    const { host, name } = liveState;
    const alerts = [];

    // 1. Host RAM Critical
    if (host.memory.usedPercent > 90) {
      alerts.push({
        title: `CRITICAL: Node RAM Exhaustion`,
        message: `Node ${name} is at ${host.memory.usedPercent}% RAM capacity.`,
        type: "error",
      });
    } else if (host.memory.usedPercent > 80) {
      alerts.push({
        title: `WARNING: High Node RAM`,
        message: `Node ${name} is at ${host.memory.usedPercent}% RAM usage.`,
        type: "warning",
      });
    }

    // 2. Host CPU Critical
    if (host.cpu.usedPercent > 85) {
      alerts.push({
        title: `CRITICAL: Node CPU Spiking`,
        message: `Node ${name} CPU is at ${host.cpu.usedPercent}% across ${host.cpu.cores} cores.`,
        type: "error",
      });
    }

    await this.dispatchAlerts(alerts);
  }

  async processBotMetrics(bots) {
    const alerts = [];

    for (const bot of bots) {
      // 1. Bot RAM Limit Warning
      if (bot.usedRam > bot.limitRam * 0.9 && bot.limitRam > 0) {
        alerts.push({
          title: `Bot Near Limit: ${bot.name}`,
          message: `Bot "${bot.name}" (User: ${bot.user}) is using ${bot.usedRam}MB / ${bot.limitRam}MB.`,
          type: "warning",
          link: `/admin/bots/${bot.id}`,
        });
      }

      // 2. Bot State Detection
      if (bot.state === "offline" && bot.status === "online") {
        alerts.push({
          title: `Zombie Bot: ${bot.name}`,
          message: `Bot "${bot.name}" is marked ONLINE but Pterodactyl reports process is OFFLINE.`,
          type: "error",
          link: `/admin/bots/${bot.id}`,
        });
      }
    }

    await this.dispatchAlerts(alerts);
  }

  async dispatchAlerts(alerts) {
    for (const alertData of alerts) {
      // Prevent spam: Only create if same alert hasn't been sent in last 10 minutes
      const alertKey = `${alertData.title}:${alertData.message}`;
      const lastSent = this.activeAlerts.get(alertKey);

      if (!lastSent || Date.now() - lastSent > 600000) {
        await Notification.create({
          ...alertData,
          user: null, // System-wide / Admin alert
          type: "alert", // We keep internal enum in mind, 'alert' is specialized info
        });
        this.activeAlerts.set(alertKey, Date.now());
        console.log(`[AlertingService] Dispatched: ${alertData.title}`);
      }
    }
  }
}

module.exports = new AlertingService();
