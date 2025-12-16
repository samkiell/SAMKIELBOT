const express = require("express");
const {
  register,
  login,
  verifyToken,
  updateProfile,
  validateReferrer,
} = require("../controllers/authController");
const { protect } = require("../utils/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verify", protect, verifyToken);
router.put("/profile", protect, updateProfile);
router.get("/validate-referrer/:username", validateReferrer);

module.exports = router;
