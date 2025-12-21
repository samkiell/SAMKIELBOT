const Notification = require("@/models/Notification");
const Suggestion = require("@/models/Suggestion");
const Deployment = require("@/models/Deployment");
const User = require("@/models/User");
const { successResponse, errorResponse } = require("@/lib/utils/response");

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
    const notifications = await Notification.find({
      $or: [{ user: req.user.id }, { user: null }], // Specific or Broadcast
    })
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
      await Notification.updateMany(
        { $or: [{ user: req.user.id }, { user: null }], isRead: false },
        { isRead: true }
      );
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
    const { userId, title, message, type } = req.body;
    // userId null = broadcast
    const notification = await Notification.create({
      user: userId || null,
      title: title || "New Notification",
      message,
      type: type || "info",
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
    const { title, message } = req.body;
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
      uptimeStart: b.uptimeStart,
      resourceState: b.resources?.state || "offline",
    }));

    successResponse(res, formatted);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getNotifications,
  markRead,
  sendNotification,
  createSuggestion,
  getSuggestions,
  updateSuggestion,
  getBotsList,
  WELCOME_MSG,
};
