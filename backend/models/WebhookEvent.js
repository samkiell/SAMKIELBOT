const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["paystack"],
      required: true,
      index: true,
    },
    event: {
      type: String,
      required: true,
      index: true,
    },
    reference: {
      type: String,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    processed: {
      type: Boolean,
      default: false,
      index: true,
    },
    processedAt: {
      type: Date,
    },
    error: {
      type: String,
    },
    signature: {
      type: String,
    },
    signatureValid: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
webhookEventSchema.index({ provider: 1, event: 1, createdAt: -1 });
webhookEventSchema.index({ reference: 1, createdAt: -1 });
webhookEventSchema.index({ processed: 1, createdAt: -1 });

module.exports = mongoose.model("WebhookEvent", webhookEventSchema);
