const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Prevent duplicate referrals
    },
    creditsAwarded: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate referrals
referralSchema.index({ referrerId: 1, referredUserId: 1 }, { unique: true });

module.exports =
  mongoose.models.Referral || mongoose.model("Referral", referralSchema);
