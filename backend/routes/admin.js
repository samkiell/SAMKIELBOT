const express = require("express");
const router = express.Router();
const { protect, admin } = require("../utils/authMiddleware");
const User = require("../models/User");
const { successResponse, errorResponse } = require("../utils/response");

const {
  getSystemStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllBots,
  controlBot,
  suspendBot,
  deleteBot,
  syncNodes,
  getNodes,
  getAuditLogs,
  getUserDetails,
  getUserBots,
  getSuggestions,
  updateSuggestion,
  sendNotification,
  getServerConsole,
} = require("../controllers/adminController");

// @desc    Dashboard
router.get("/dashboard", protect, admin, getSystemStats);

// @desc    User Management
router.get("/users", protect, admin, getAllUsers);
router.get("/users/:id", protect, admin, getUserDetails);
router.put("/users/:id", protect, admin, updateUser);
router.delete("/users/:id", protect, admin, deleteUser);
router.get("/users/:id/bots", protect, admin, getUserBots);

// @desc    Bot Management
router.get("/bots", protect, admin, getAllBots);
router.post("/bots/:id/power", protect, admin, controlBot);
router.post("/bots/:id/suspend", protect, admin, suspendBot);
router.delete("/bots/:id", protect, admin, deleteBot);

// @desc    Server Console
router.get("/server/:id/console", protect, admin, getServerConsole);

// @desc    Infrastructure
router.get("/nodes", protect, admin, getNodes);
router.post("/nodes/sync", protect, admin, syncNodes);

// @desc    Audit Logs
router.get("/audit-logs", protect, admin, getAuditLogs);

// @desc    Suggestions
router.get("/suggestions", protect, admin, getSuggestions);
router.put("/suggestions/:id", protect, admin, updateSuggestion);

// @desc    Notifications
router.post("/notifications", protect, admin, sendNotification);

// @desc    Settings (Feature Flags)
const {
  getFeatureFlags,
  updateFeatureFlag,
} = require("../controllers/adminController");
router.get("/settings/flags", protect, admin, getFeatureFlags);
router.put("/settings/flags/:key", protect, admin, updateFeatureFlag);

module.exports = router;
