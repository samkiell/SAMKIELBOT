const mongoose = require("mongoose");

const deploymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
  serviceId: {
    type: String,
  },
  pairingCode: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "deploying", "running", "failed"],
    default: "pending",
  },
  errorMessage: {
    type: String,
  },
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
