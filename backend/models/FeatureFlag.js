const mongoose = require("mongoose");

const featureFlagSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g., 'beta_dashboard'
  isEnabled: { type: Boolean, default: false },
  description: { type: String },
  whitelistedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("FeatureFlag", featureFlagSchema);
