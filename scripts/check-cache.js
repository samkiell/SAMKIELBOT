const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function checkInfra() {
  try {
    const redis = require("../lib/utils/redis");
    const data = await redis.get("infra:live_state");

    if (data) {
      console.log("SUCCESS: Live state found in cache.");
      const parsed = JSON.parse(data);
      console.log(`- Droplet: ${parsed.name}`);
      console.log(`- CPU: ${parsed.host.cpu.usedPercent}%`);
      console.log(`- RAM: ${parsed.host.memory.usedMB} MB`);
      console.log(`- Disk: ${parsed.host.disk.usedGB} GB`);
      console.log(`- Heartbeat: ${parsed.timestamp}`);
    } else {
      console.log("FAIL: Redis cache 'infra:live_state' is still empty.");
      console.log("Checking if Redis is available:", redis.isAvailable());
    }
    process.exit(0);
  } catch (err) {
    console.error("Check Failed:", err);
    process.exit(1);
  }
}

checkInfra();
