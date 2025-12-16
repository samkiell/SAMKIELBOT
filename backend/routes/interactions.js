const express = require("express");
const router = express.Router();
const { protect, admin } = require("../utils/authMiddleware");
const {
  getNotifications,
  markRead,
  createSuggestion,
  getBotsList,
} = require("../controllers/interactionsController");

// Notifications
router.get("/notifications", protect, getNotifications);
router.put("/notifications/read", protect, markRead);

// Suggestions
router.post("/suggestions", protect, createSuggestion);

// Public Bots List (Authenticated Users only? Yes, usually platform users)
router.get("/bots-list", getBotsList);

module.exports = router;
