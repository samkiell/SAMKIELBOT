const mongoose = require("mongoose");

/**
 * EmailBroadcast Model
 * Logs all admin email broadcasts with delivery status and metrics
 */
const emailBroadcastSchema = new mongoose.Schema(
  {
    // The admin who sent the broadcast
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Email content
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    // Announcement type for categorization
    announcementType: {
      type: String,
      enum: [
        "general",
        "update",
        "maintenance",
        "security",
        "feature",
        "policy",
        "important",
      ],
      default: "general",
    },
    // Priority level
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    // Delivery status
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "partial", "failed"],
      default: "pending",
    },
    // Recipient statistics
    stats: {
      totalRecipients: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    // Failed email addresses (for debugging/retry)
    failedEmails: [
      {
        email: String,
        error: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    // Processing timestamps
    startedAt: { type: Date },
    completedAt: { type: Date },
    // Processing metadata
    batchSize: { type: Number, default: 10 },
    batchDelay: { type: Number, default: 1000 }, // ms between batches
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
emailBroadcastSchema.index({ createdAt: -1 });
emailBroadcastSchema.index({ sender: 1, createdAt: -1 });
emailBroadcastSchema.index({ status: 1 });

// Virtual for success rate
emailBroadcastSchema.virtual("successRate").get(function () {
  if (this.stats.totalRecipients === 0) return 0;
  return Math.round((this.stats.sent / this.stats.totalRecipients) * 100);
});

// Ensure virtuals are included in JSON output
emailBroadcastSchema.set("toJSON", { virtuals: true });
emailBroadcastSchema.set("toObject", { virtuals: true });

module.exports =
  mongoose.models.EmailBroadcast ||
  mongoose.model("EmailBroadcast", emailBroadcastSchema);
