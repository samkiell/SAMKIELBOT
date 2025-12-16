const mongoose = require("mongoose");

const creditTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "signup_bonus",
        "referral_reward",
        "purchase",
        "bot_creation",
        "resource_upgrade",
        "daily_burn",
        "refund",
        "admin_adjustment",
        "admin_grant",
        "admin_deduction",
      ],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    // For purchases
    paystackReference: {
      type: String,
      sparse: true,
      index: true,
    },
    paymentAmount: {
      type: Number, // Amount in Naira
    },
    // For bot-related transactions
    deployment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deployment",
    },
    // For referrals
    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
creditTransactionSchema.index({ user: 1, createdAt: -1 });
creditTransactionSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model("CreditTransaction", creditTransactionSchema);
