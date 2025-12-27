const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "NGN",
      required: true,
    },
    creditsGranted: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "abandoned"],
      default: "pending",
      index: true,
    },
    provider: {
      type: String,
      enum: ["paystack"],
      default: "paystack",
    },
    paystackData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    webhookProcessed: {
      type: Boolean,
      default: false,
    },
    webhookProcessedAt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
paymentTransactionSchema.index({ user: 1, createdAt: -1 });
paymentTransactionSchema.index({ status: 1, createdAt: -1 });
paymentTransactionSchema.index({ reference: 1 }, { unique: true });

module.exports =
  mongoose.models.PaymentTransaction ||
  mongoose.model("PaymentTransaction", paymentTransactionSchema);
