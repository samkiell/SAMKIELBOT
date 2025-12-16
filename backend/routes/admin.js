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

// @desc    Node & Infrastructure
router.get("/nodes", protect, admin, getNodes);
router.post("/nodes/sync", protect, admin, syncNodes);

// @desc    Audit Logs
router.get("/audit-logs", protect, admin, getAuditLogs);

module.exports = router;
