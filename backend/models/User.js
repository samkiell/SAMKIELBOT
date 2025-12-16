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
    // Billing & Subscription
    accountType: {
      type: String,
      enum: ["FREE", "PREMIUM"],
      default: "FREE",
    },
    currentPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "inactive",
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
    paystackCustomerId: {
      type: String,
      default: null,
    },
    limits: {
      maxBots: { type: Number, default: DEFAULT_LIMITS.maxBots },
      maxRam: { type: Number, default: DEFAULT_LIMITS.maxRam },
      maxCpu: { type: Number, default: DEFAULT_LIMITS.maxCpu },
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

module.exports = mongoose.model("User", userSchema);
