const express = require("express");
const router = express.Router();
const { protect, admin } = require("../utils/authMiddleware");
const User = require("../models/User");
const { successResponse, errorResponse } = require("../utils/response");

const {
  getAllBots,
  controlBot,
  suspendBot,
  deleteBot,
  getUserDetails,
  getUserBots,
} = require("../controllers/adminController");

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
router.get("/users", protect, admin, async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });
    successResponse(res, users);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
});

// @desc    Bot Management Routes
router.get("/bots", protect, admin, getAllBots);
router.post("/bots/:id/power", protect, admin, controlBot);
router.post("/bots/:id/suspend", protect, admin, suspendBot);
router.delete("/bots/:id", protect, admin, deleteBot);

// @desc    User Detail Routes
router.get("/users/:id", protect, admin, getUserDetails);
router.get("/users/:id/bots", protect, admin, getUserBots);

module.exports = router;
