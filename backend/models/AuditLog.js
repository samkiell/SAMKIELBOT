const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  adminEmail: {
    type: String,
    required: true,
  },
  botId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Deployment",
  },
  action: {
    type: String, // 'start', 'stop', 'restart', 'delete', 'suspend', 'unsuspend'
    required: true,
  },
  details: {
    type: Object, // Extra context if needed
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
