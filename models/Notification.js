const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  title: {
    type: String,
    default: "Notification",
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      "info",
      "success",
      "error",
      "warning",
      "welcome",
      "update",
      "maintenance",
      "alert",
      "announcement",
      "offer",
    ],
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

// ✅ THIS IS THE CRITICAL FIX
module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
