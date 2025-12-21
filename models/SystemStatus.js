const mongoose = require("mongoose");

/**
 * SystemStatus Model
 * Tracks real-time status of platform components
 * For future automation of status page
 */
const systemStatusSchema = new mongoose.Schema(
  {
    componentId: {
      type: String,
      required: true,
      enum: ["website", "deployment", "runtime", "whatsapp", "billing"],
      unique: true,
    },
    componentName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["operational", "degraded", "down"],
      default: "operational",
    },
    description: {
      type: String,
    },
    lastChecked: {
      type: Date,
      default: Date.now,
    },
    uptime: {
      type: Number, // Percentage (0-100)
      default: 100,
    },
    responseTime: {
      type: Number, // Average response time in ms
      default: 0,
    },
  },
  { timestamps: true }
);

/**
 * Incident Model
 * Tracks service incidents and outages
 */
const incidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    affectedComponents: [
      {
        type: String,
        enum: ["website", "deployment", "runtime", "whatsapp", "billing"],
      },
    ],
    severity: {
      type: String,
      enum: ["minor", "major", "critical"],
      default: "minor",
    },
    status: {
      type: String,
      enum: ["investigating", "identified", "monitoring", "resolved"],
      default: "investigating",
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
    },
    duration: {
      type: String, // e.g., "45 minutes", "2 hours"
    },
    updates: [
      {
        timestamp: { type: Date, default: Date.now },
        message: String,
        status: String,
      },
    ],
  },
  { timestamps: true }
);

/**
 * Maintenance Model
 * Tracks scheduled maintenance windows
 */
const maintenanceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    affectedComponents: [
      {
        type: String,
        enum: ["website", "deployment", "runtime", "whatsapp", "billing"],
      },
    ],
    scheduledFor: {
      type: Date,
      required: true,
    },
    duration: {
      type: String, // e.g., "30 minutes", "2 hours"
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled",
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for performance
systemStatusSchema.index({ componentId: 1 });
incidentSchema.index({ status: 1, startedAt: -1 });
maintenanceSchema.index({ scheduledFor: 1, status: 1 });

module.exports = {
  SystemStatus:
    mongoose.models.SystemStatus ||
    mongoose.model("SystemStatus", systemStatusSchema),
  Incident:
    mongoose.models.Incident || mongoose.model("Incident", incidentSchema),
  Maintenance:
    mongoose.models.Maintenance ||
    mongoose.model("Maintenance", maintenanceSchema),
};
