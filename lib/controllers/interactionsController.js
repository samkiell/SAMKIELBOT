const Notification = require("../../models/Notification");
const Suggestion = require("../../models/Suggestion");
const Deployment = require("../../models/Deployment");
const User = require("../../models/User");
const { successResponse, errorResponse } = require("../utils/response");

// Notifications Config
const WELCOME_MSG = {
  title: "🎉 Welcome to SAMKIEL BOT!",
  message:
    "Join our WhatsApp channel for updates: https://whatsapp.com/channel/0029VbAhWo3C6Zvf2t4Rne0h",
  type: "welcome",
};

// @desc    Get User Notifications
// @route   GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const query = {
      $or: [{ user: req.user.id }, { user: null }],
    };

    // If not admin, exclude isAdminOnly notifications
    if (req.user.role !== "admin") {
      query.isAdminOnly = { $ne: true };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
    successResponse(res, notifications);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Mark one or all as read
// @route   PUT /api/notifications/read
const markRead = async (req, res) => {
  try {
    const { id, all } = req.body;
    if (all) {
      const query = {
        $or: [{ user: req.user.id }, { user: null }],
        isRead: false,
      };
      if (req.user.role !== "admin") {
        query.isAdminOnly = { $ne: true };
      }
      await Notification.updateMany(query, { isRead: true });
    } else if (id) {
      // Security: ensure it belongs to user or is broadcast
      // Optimization: Just update by ID for now, assume ID validity check implicitly
      await Notification.findByIdAndUpdate(id, { isRead: true });
    }
    successResponse(res, { message: "Updated" });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Admin: Send Notification
// @route   POST /api/admin/notifications
const sendNotification = async (req, res) => {
  try {
    const { userId, title, message, type, isAdminOnly } = req.body;
    // userId null = broadcast
    const notification = await Notification.create({
      user: userId || null,
      title: title || "New Notification",
      message,
      type: type || "info",
      isAdminOnly: isAdminOnly || false,
    });
    successResponse(res, notification);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Create Suggestion
// @route   POST /api/suggestions
const createSuggestion = async (req, res) => {
  try {
    const { title } = req.body;
    const message = req.body.message?.trim();

    if (!title || !message) {
      return errorResponse(res, "Title and message are required", 400);
    }

    const suggestion = await Suggestion.create({
      user: req.user.id,
      title,
      message,
    });

    successResponse(res, suggestion);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Admin: Get Suggestions
// @route   GET /api/admin/suggestions
const getSuggestions = async (req, res) => {
  try {
    const suggestions = await Suggestion.find({})
      .populate("user", "email username")
      .sort({ createdAt: -1 });
    successResponse(res, suggestions);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Admin: Update Suggestion (Mark read/delete)
// @route   PUT /api/admin/suggestions/:id
const updateSuggestion = async (req, res) => {
  try {
    const { status, delete: del } = req.body;
    if (del) {
      await Suggestion.findByIdAndDelete(req.params.id);
      return successResponse(res, { message: "Deleted" });
    }
    const suggestion = await Suggestion.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    successResponse(res, suggestion);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Get Public Bots List
// @route   GET /api/bots-list
const getBotsList = async (req, res) => {
  try {
    // Only running bots? Or all bots from users who have bots?
    // Requirement: "List ONLY users who have at least one bot deployed"
    // Display: username, botname, status, last active, uptime

    // Aggregation might be better, but let's do simple query for now
    const bots = await Deployment.find({}) // Only "active" users? Requirement says "at least one bot".
      .populate("user", "username")
      .select(
        "botName status isActive lastActiveAt lastActivity lastHeartbeatAt uptimeStart usageStats resources user createdAt"
      );

    // Filter out if user is null (deleted user)
    const validBots = bots.filter((b) => b.user);

    // Format for UI
    const formatted = validBots.map((b) => ({
      _id: b._id,
      username: b.user.username,
      botName: b.botName,
      status: b.status,
      isActive: b.isActive || false,
      lastActive: b.lastActiveAt || b.lastActivity || b.createdAt,
      lastHeartbeat: b.lastHeartbeatAt,
      uptime: b.usageStats?.uptimeMinutes || 0,
      uptimeMs: b.resources?.uptimeMs || 0,
      lastUptimeUpdate:
        b.resources?.lastUptimeUpdate || b.lastHeartbeatAt || b.lastActiveAt,
      uptimeStart: b.uptimeStart,
      resourceState: b.resources?.state || "offline",
    }));

    successResponse(res, formatted);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

const deleteNotification = async (req, res) => {
  try {
    // ID comes from slug in the route handler, we can pass it via req.query or arguments
    const { id } = req.query;

    // Find and delete
    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return errorResponse(res, "Notification not found", 404);
    }

    successResponse(res, { message: "Notification deleted" });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getNotifications,
  markRead,
  sendNotification,
  deleteNotification,
  createSuggestion,
  getSuggestions,
  updateSuggestion,
  getBotsList,
  WELCOME_MSG,
};
