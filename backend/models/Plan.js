const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ["Starter", "Pro", "Max"],
    },
    displayName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true, // Price in Naira
    },
    currency: {
      type: String,
      default: "NGN",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    // Resource Limits
    maxBots: {
      type: Number,
      required: true,
      default: 3,
    },
    cpuLimit: {
      type: Number,
      required: true, // Percentage
    },
    ramLimit: {
      type: Number,
      required: true, // MB
    },
    diskLimit: {
      type: Number,
      required: true, // MB
    },
    // Features
    features: {
      type: [String],
      default: [],
    },
    // Plan Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isRecommended: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
