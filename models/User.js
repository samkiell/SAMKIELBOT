const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Default limits
const DEFAULT_LIMITS = {
  maxBots: 1,
  maxRam: 1024, // MB
  maxCpu: 100, // %
};

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    whatsappNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    profileImage: { type: String, default: null }, // Cloudinary image URL
    role: {
      type: String,
      enum: ["user", "power_user", "admin"],
      default: "user",
    },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "deleted"], // deleted = soft delete
      default: "active",
    },
    lastLogin: { type: Date },
    // Credit-Based Billing
    credits: {
      type: Number,
      default: 25, // Signup bonus
      min: 0,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    referralRewardClaimed: {
      type: Boolean,
      default: false,
    },
    // Daily Credit Claim
    lastDailyClaim: {
      type: Date,
      default: null,
    },
    totalReferrals: {
      type: Number,
      default: 0,
    },
    referralCount: {
      type: Number,
      default: 0,
    },
    // OTP Verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      code: { type: String }, // Hashed OTP
      expiresAt: { type: Date },
      type: { type: String, enum: ["email", "phone"] },
      attempts: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Password encryption
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
