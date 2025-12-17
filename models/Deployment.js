const mongoose = require("mongoose");

const deploymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  botName: {
    type: String,
    required: true,
  },
  botNumber: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{10,15}$/.test(v);
      },
      message: "Bot number must be a valid international number (10-15 digits)",
    },
  },
  pterodactylId: {
    type: Number,
  },
  pterodactylUuid: {
    type: String,
  },
  identifier: {
    type: String,
  },
  nodeId: {
    type: Number,
  },
  eggId: {
    type: Number,
  },
  serviceId: {
    type: String,
  },
  pairingCode: {
    type: String,
  },
  // BOT STATUS STATE MACHINE
  status: {
    type: String,
    enum: [
      "pending",
      "creating",
      "installing",
      "starting",
      "awaiting_pairing",
      "paired",
      "connected",
      "active",
      "running", // Legacy compatibility
      "stopped",
      "offline",
      "failed",
      "suspended",
    ],
    default: "pending",
  },
  // BOT HEALTH TRACKING
  isActive: {
    type: Boolean,
    default: false,
  },
  lastActiveAt: {
    type: Date,
  },
  pairedAt: {
    type: Date,
  },
  connectedAt: {
    type: Date,
  },
  uptimeStart: {
    type: Date,
  },
  errorMessage: {
    type: String,
  },
  resources: {
    ramLimit: { type: Number, default: 300 },
    cpuLimit: { type: Number, default: 25 },
    diskLimit: { type: Number, default: 500 },
    usedRam: { type: Number, default: 0 },
    usedCpu: { type: Number, default: 0 },
    usedDisk: { type: Number, default: 0 },
    state: { type: String, default: "offline" },
    uptimeMs: { type: Number, default: 0 },
  },
  // Credit-based billing
  creationCost: {
    type: Number,
    default: 50,
  },
  resourceCost: {
    type: Number,
    default: 0,
  },
  totalCost: {
    type: Number,
    default: 50,
  },
  dailyBurn: {
    type: Number,
    default: 2, // Base daily burn
  },
  lastBurnDate: {
    type: Date,
  },
  usageStats: {
    uptimeMinutes: { type: Number, default: 0 },
    cpuUsedMinutes: { type: Number, default: 0 },
    ramInfos: { type: [Number], default: [] },
  },
  lastActivity: { type: Date, default: Date.now },
  deployedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports =
  mongoose.models.Deployment || mongoose.model("Deployment", deploymentSchema);
