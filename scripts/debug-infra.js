const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(process.cwd(), ".env") });

const Deployment = require("../models/Deployment");
const User = require("../models/User");
const Node = require("../models/Node");

async function debug() {
  try {
    const uri = process.env.MONGO_URI;
    console.log("MONGO_URI present:", !!uri);
    if (!uri) {
      console.log(
        "Keys found in process.env:",
        Object.keys(process.env).length
      );
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected.");

    const bots = await Deployment.find({});
    console.log("\n--- BOTS ---");
    bots.forEach((b) => {
      console.log(`Bot: ${b.botName} (ID: ${b.pterodactylId || "N/A"})`);
      console.log(`  UUID: ${b.pterodactylUuid}`);
      console.log(`  Status: ${b.status}`);
      console.log(`  isActive Flag: ${b.isActive}`);
      console.log(`  Used RAM: ${b.resources?.usedRam} MB`);
      console.log(`  Used CPU: ${b.resources?.usedCpu} %`);
      console.log(`  Last Heartbeat: ${b.lastHeartbeatAt}`);
    });

    const nodes = await Node.find({});
    console.log("\n--- NODES ---");
    nodes.forEach((n) => {
      console.log(`Node: ${n.name} (${n.status})`);
      console.log(`  FQDN: ${n.fqdn}`);
      console.log(
        `  Disk: ${n.resources.usedDisk} / ${n.resources.totalDisk} MB`
      );
      console.log(`  RAM: ${n.resources.usedRam} / ${n.resources.totalRam} MB`);
      console.log(`  CPU: ${n.resources.usedCpu} / ${n.resources.totalCpu} %`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debug();
