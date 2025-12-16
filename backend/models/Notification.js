const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null, // Null means broadcast to all
  },
  title: {
    type: String,
    required: false,
    default: "Notification",
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["info", "success", "error", "warning", "welcome"],
    default: "info",
  },
  link: {
    type: String,
    default: null,
  },
  linkText: {
    type: String,
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", notificationSchema);
