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
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
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
    totalReferrals: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Generate referral code before saving
userSchema.pre("save", async function (next) {
  if (!this.referralCode && this.isNew) {
    this.referralCode = generateReferralCode(this.username);
  }
  next();
});

// Generate unique referral code
function generateReferralCode(username) {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${username.substring(0, 4).toUpperCase()}${random}`;
}

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

module.exports = mongoose.model("User", userSchema);
