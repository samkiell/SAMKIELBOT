const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  adminEmail: {
    type: String,
    required: true,
  },
  targetType: {
    type: String,
    enum: ["User", "Deployment", "Node", "System"],
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "targetType",
  },
  ipAddress: { type: String },
  details: {
    type: Object, // Extra context if needed
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports =
  mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
