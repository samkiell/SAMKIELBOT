const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    // Paystack Integration
    paystackReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    paystackSubscriptionCode: {
      type: String,
      sparse: true,
    },
    paystackCustomerCode: {
      type: String,
    },
    // Payment Details
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    // Subscription Status
    status: {
      type: String,
      enum: ["active", "inactive", "expired", "cancelled", "pending"],
      default: "pending",
      index: true,
    },
    // Subscription Period
    startedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    cancelledAt: {
      type: Date,
    },
    // Auto-renewal
    autoRenew: {
      type: Boolean,
      default: true,
    },
    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Audit Trail
    paymentHistory: [
      {
        reference: String,
        amount: Number,
        status: String,
        paidAt: Date,
      },
    ],
  },
  { timestamps: true }
);

// Index for efficient queries
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ expiresAt: 1, status: 1 });

// Check if subscription is active
subscriptionSchema.methods.isActive = function () {
  return this.status === "active" && this.expiresAt > new Date();
};

// Check if subscription is expiring soon (within 7 days)
subscriptionSchema.methods.isExpiringSoon = function () {
  if (this.status !== "active") return false;
  const daysUntilExpiry = Math.ceil(
    (this.expiresAt - new Date()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
};

module.exports =
  mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);
