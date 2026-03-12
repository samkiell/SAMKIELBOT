const mongoose = require("mongoose");

/**
 * BroadcastRecipient Model
 * Tracks delivery status for each user in a broadcast
 */
const broadcastRecipientSchema = new mongoose.Schema(
  {
    broadcast: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailBroadcast",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "sending", "sent", "failed"],
      default: "pending",
      index: true,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient batching
broadcastRecipientSchema.index({ broadcast: 1, status: 1 });

module.exports =
  mongoose.models.BroadcastRecipient ||
  mongoose.model("BroadcastRecipient", broadcastRecipientSchema);
