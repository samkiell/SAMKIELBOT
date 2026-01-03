const digitalOcean = require("../lib/utils/digitalOcean");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function debugCpu() {
  const dropletId = process.env.DIGITALOCEAN_DROPLET_ID;
  console.log("Droplet ID:", dropletId);

  try {
    const metrics = await digitalOcean.getDropletMetrics(dropletId);
    console.log("CPU Metrics Count:", metrics.cpu?.length);
    if (metrics.cpu) {
      metrics.cpu.forEach((s, i) => {
        const lastVal = s.values?.slice(-1)[0];
        console.log(
          `Core ${i} [${s.metric.cpu || "all"}]: ${s.metric.mode} = ${
            lastVal?.[1]
          } at ${new Date(lastVal?.[0] * 1000).toISOString()}`
        );
      });
    }

    const idle = metrics.cpu
      ?.find((s) => s.metric.mode === "idle")
      ?.values?.slice(-1)[0]?.[1];
    console.log("\nCalculated Idle:", idle);
    console.log(
      "Usage:",
      idle ? (100 - parseFloat(idle)).toFixed(2) + "%" : "N/A"
    );
  } catch (err) {
    console.error("Error:", err.message);
  }
}

debugCpu();
