const dotenv = require("dotenv");
const path = require("path");
const digitalOcean = require("../lib/utils/digitalOcean");

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function testInfra() {
  try {
    const dropletId = process.env.DIGITALOCEAN_DROPLET_ID;
    console.log(`Polling droplet ${dropletId}...`);

    const info = await digitalOcean.getDropletInfo(dropletId);
    console.log(
      `Droplet Info: ${info.name} (${info.vcpus} vCPUs, ${info.memory}MB RAM)`
    );

    const metrics = await digitalOcean.getDropletMetrics(dropletId);
    console.log(`Metrics Fetched:`, metrics ? "YES" : "NO");
    if (metrics) {
      console.log(`  Memory Type: ${metrics.memoryType}`);
      console.log(
        `  Memory Data: ${metrics.memory ? metrics.memory.length : 0} points`
      );
      console.log(`  CPU Data: ${metrics.cpu ? metrics.cpu.length : 0} points`);
      console.log(
        `  FS Data: ${
          metrics.filesystem ? metrics.filesystem.length : 0
        } points`
      );
    }

    process.exit(0);
  } catch (err) {
    console.error("Test Error:", err.message);
    if (err.response) {
      console.error("  Data:", err.response.data);
    }
    process.exit(1);
  }
}

testInfra();
