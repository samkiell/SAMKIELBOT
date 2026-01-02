const dotenv = require("dotenv");
const path = require("path");
const digitalOcean = require("../lib/utils/digitalOcean");
const infraOrchestrator = require("../lib/services/infraOrchestrator");

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function testNormalization() {
  try {
    const dropletId = process.env.DIGITALOCEAN_DROPLET_ID;
    console.log(`Polling droplet ${dropletId}...`);

    const info = await digitalOcean.getDropletInfo(dropletId);
    const metrics = await digitalOcean.getDropletMetrics(dropletId);

    // Manual call to fetch bots to simulate full poll
    const bots = [];

    console.log("Normalizing...");
    const liveState = infraOrchestrator.normalizeMetrics(metrics, info, bots);

    console.log("FINAL LIVE STATE:");
    console.log(JSON.stringify(liveState, null, 2));

    process.exit(0);
  } catch (err) {
    console.error("Test Error:", err.message);
    process.exit(1);
  }
}

testNormalization();
