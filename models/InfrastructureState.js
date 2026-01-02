const mongoose = require("mongoose");

const infrastructureStateSchema = new mongoose.Schema(
  {
    key: { type: String, default: "live_state", unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.InfrastructureState ||
  mongoose.model("InfrastructureState", infrastructureStateSchema);
