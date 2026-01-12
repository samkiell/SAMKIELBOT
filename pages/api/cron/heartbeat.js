import connectDB from "../../../lib/db";
import botHealthService from "../../../lib/services/botHealthService";
import Deployment from "../../../models/Deployment";

export default async function handler(req, res) {
  // Allow GET requests (Cron jobs are GET)
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optional: Secure this endpoint
  // if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  try {
    await connectDB();
    console.log("[Cron] Starting Bot Heartbeat...");

    // 1. Get bots that should be checked
    const { id } = req.query;
    let query = {};

    if (id) {
      // Manual Ping: Check specific bot regardless of current status (to allow recovery)
      // We only ensure it has been deployed (has server ID)
      query = { _id: id };
    } else {
      // Automated Cron: Only check currently active/running bots
      query = {
        status: {
          $in: [
            "starting",
            "active",
            "online",
            "degraded",
            "awaiting_pairing",
            "paired",
            "connected",
          ],
        },
        isActive: true,
      };
    }

    const bots = await Deployment.find(query);

    console.log(`[Cron] Checking ${bots.length} active bots...`);

    const results = {
      checked: 0,
      errors: 0,
      details: [],
    };

    // 2. Perform checks for each bot
    // We use Promise.all for parallelism, but be careful with rate limits if many bots
    const checks = bots.map(async (bot) => {
      try {
        const id = bot._id.toString();

        // A. Resource Check (RAM, CPU, Uptime) - via API
        await botHealthService.performHealthCheck(id);

        // B. Log Check (Status Sync) - via WS (short connection)
        // This helps detect crashes or disconnects that API status might miss
        await botHealthService.syncBotState(id);

        results.checked++;
        return { id, status: "ok" };
      } catch (error) {
        console.error(
          `[Cron] Error checking bot ${bot.botName}:`,
          error.message
        );
        results.errors++;
        return { id: bot._id, error: error.message };
      }
    });

    await Promise.all(checks);

    // 3. Check for stale heartbeats (Clean up dead bots)
    await botHealthService.checkStaleHeartbeats();

    console.log(
      `[Cron] Heartbeat complete. Processed ${results.checked} bots.`
    );

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("[Cron] Critical Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
