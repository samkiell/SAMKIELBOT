const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pterodactylId: { type: Number, required: true, unique: true },
  fqdn: { type: String, required: true },
  status: {
    type: String,
    enum: ["online", "offline", "degraded", "maintenance"],
    default: "online",
  },
  resources: {
    totalRam: { type: Number, required: true }, // MB
    usedRam: { type: Number, default: 0 },
    totalCpu: { type: Number, required: true }, // % usually 100 * cores
    usedCpu: { type: Number, default: 0 },
    totalDisk: { type: Number, required: true },
    usedDisk: { type: Number, default: 0 },
  },
  serverCount: { type: Number, default: 0 },
  lastHeartbeat: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Node", nodeSchema);
