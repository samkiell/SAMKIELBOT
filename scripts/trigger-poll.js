const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(process.cwd(), ".env") });

const infraOrchestrator = require("../lib/services/infraOrchestrator");
const dbConnect = require("../lib/dbConnect");

async function manualPoll() {
  try {
    console.log("Connecting to DB...");
    await dbConnect();
    console.log("Connected.");

    console.log("Triggering manual poll...");
    await infraOrchestrator.poll();

    console.log("Poll completed.");

    const redis = require("./lib/utils/redis");
    const data = await redis.get("infra:live_state");
    if (data) {
      console.log("Redis Data Found:");
      const parsed = JSON.parse(data);
      console.log(`- Droplet: ${parsed.name}`);
      console.log(`- CPU: ${parsed.host.cpu.usedPercent}%`);
      console.log(
        `- RAM: ${parsed.host.memory.usedMB} / ${parsed.host.memory.totalMB} MB`
      );
      console.log(`- Disk: ${parsed.host.disk.usedGB} GB`);
      console.log(`- Bots: ${parsed.bots.length}`);
    } else {
      console.log("Redis is STILL EMPTY after poll!");
    }

    process.exit(0);
  } catch (err) {
    console.error("Manual Poll Failed:", err);
    process.exit(1);
  }
}

manualPoll();
