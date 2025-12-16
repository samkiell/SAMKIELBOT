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
        return /^\d{10,15}$/.test(v); // International WhatsApp number validation
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
    type: String, // Deprecated Render ID, kept for legacy or fallback
  },
  pairingCode: {
    type: String,
  },
  status: {
    type: String,
    enum: [
      "pending",
      "creating",
      "installing",
      "starting",
      "awaiting_pairing",
      "running",
      "stopped",
      "failed",
      "suspended",
    ],
    default: "pending",
  },
  errorMessage: {
    type: String,
  },
  resources: {
    ramLimit: { type: Number, default: 1024 }, // MB
    cpuLimit: { type: Number, default: 100 }, // %
    diskLimit: { type: Number, default: 1024 }, // MB
  },
  usageStats: {
    uptimeMinutes: { type: Number, default: 0 },
    cpuUsedMinutes: { type: Number, default: 0 },
    ramInfos: { type: [Number], default: [] }, // Sampling history? Or just keep simple
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

module.exports = mongoose.model("Deployment", deploymentSchema);
