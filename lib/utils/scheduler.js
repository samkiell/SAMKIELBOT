const cron = require("node-cron");
const Deployment = require("../../models/Deployment");
const Node = require("../../models/Node");
const pterodactyl = require("./pterodactyl");

// Run every 5 minutes
const initScheduler = () => {
  console.log("Initializing Admin Scheduler...");

  // Bot Heartbeat Check & Recovery (Every 1 minute)
  // Bot Heartbeat Check & Recovery (Every 1 minute)
  // cron.schedule("*/1 * * * *", async () => {
  //   const botHealthService = require("../services/botHealthService");
  //   await botHealthService.reconcileMonitors();
  //   await botHealthService.checkStaleHeartbeats();
  // });

  // Sync Node Status
  cron.schedule("*/5 * * * *", async () => {
    console.log("[Scheduler] Syncing Nodes...");
    try {
      const pteroNodes = await pterodactyl.getNodes();
      for (const pNode of pteroNodes) {
        // Update logic typically goes here, keeping it synced
        await Node.findOneAndUpdate(
          { pterodactylId: pNode.attributes.id },
          {
            status: pNode.attributes.maintenance_mode
              ? "maintenance"
              : "online",
          },
          { upsert: true },
        );
      }
    } catch (e) {
      console.error("[Scheduler] Node Sync Error:", e.message);
    }
  });

  // Check Deployment Statuses (Reconcile)
  cron.schedule("*/10 * * * *", async () => {
    console.log("[Scheduler] Reconciling Deployments...");
    const runningBots = await Deployment.find({
      status: { $in: ["running", "starting"] },
    });

    for (const bot of runningBots) {
      try {
        if (!bot.pterodactylId) continue;
        const details = await pterodactyl.getServerDetails(bot.pterodactylId);

        // Map Ptero status to our status
        // Ptero: installing, suspended, restoring, etc.
        // If suspended in Ptero but running in DB -> update DB
        if (details.attributes.suspended) {
          bot.status = "suspended";
          await bot.save();
        } else if (bot.status === "running") {
          // Increment uptime stats
          bot.usageStats = bot.usageStats || {};
          bot.usageStats.uptimeMinutes =
            (bot.usageStats.uptimeMinutes || 0) + 10; // Approx 10 min interval
          await bot.save();
        }
      } catch (e) {
        if (e.response && e.response.status === 404) {
          // Server deleted on Ptero?
          bot.status = "failed"; // or 'deleted'
          bot.errorMessage = "Server not found on Pterodactyl";
          await bot.save();
        }
      }
    }
  });

  // Proactive Credit Burn (Every 4 Hours)
  // Ensures bots are billed as soon as they reach their renewal time
  // Reduced from hourly to minimize race conditions (Fix: Issue #2)
  cron.schedule("0 */4 * * *", async () => {
    console.log("[Scheduler] Processing proactive credit burn (4-hourly)...");
    try {
      const creditService = require("../services/creditService");
      const result = await creditService.processDailyBurn();
      if (result.totalBurned > 0 || result.botsSuspended > 0) {
        console.log(
          `[Scheduler] Proactive burn complete: ${result.totalBurned} credits burned, ${result.botsSuspended} bots suspended`,
        );
      }
    } catch (e) {
      console.error("[Scheduler] Credit Burn Error:", e.message);
    }
  });

  console.log("Scheduler Active.");
};

module.exports = initScheduler;
