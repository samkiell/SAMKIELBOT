const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { successResponse, errorResponse } = require("../utils/response");

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { fullName, username, email, whatsappNumber, password } = req.body;

    // Validation for required fields
    if (!fullName || !username || !email || !whatsappNumber || !password) {
      return errorResponse(res, "All fields are required", 400);
    }

    // Additional backend validation for uniqueness (pre-check before MongoDB)
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { username: username.toLowerCase().trim() },
        { whatsappNumber: whatsappNumber.trim() },
      ],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase().trim()) {
        return errorResponse(res, "Email already exists.", 400, "email_exists");
      }
      if (existingUser.username === username.toLowerCase().trim()) {
        return errorResponse(
          res,
          "Username already exists.",
          400,
          "username_exists"
        );
      }
      if (existingUser.whatsappNumber === whatsappNumber.trim()) {
        return errorResponse(
          res,
          "WhatsApp number already exists.",
          400,
          "whatsappNumber_exists"
        );
      }
    }

    // Create user
    const user = await User.create({
      fullName,
      username,
      email,
      whatsappNumber,
      password,
      role: email === "samkiel.dev@gmail.com" ? "admin" : "user",
    });

    // Auto-Welcome Notification
    const Notification = require("../models/Notification");
    await Notification.create({
      user: user._id,
      title: "🎉 Welcome to SAMKIEL BOT!",
      message:
        "Join our WhatsApp channel for updates: https://whatsapp.com/channel/0029VbAhWo3C6Zvf2t4Rne0h",
      type: "welcome",
    });

    if (user) {
      successResponse(res, {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        whatsappNumber: user.whatsappNumber,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      errorResponse(res, "Invalid user data", 400);
    }
  } catch (error) {
    // Handle duplicate key errors (fallback)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return errorResponse(
        res,
        `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`,
        400,
        `${field}_exists`
      );
    }
    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return errorResponse(res, messages.join(", "), 400, "validation_error");
    }
    errorResponse(
      res,
      "Registration failed. Please try again.",
      500,
      "general_error"
    );
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or username

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (user && (await user.matchPassword(password))) {
      successResponse(res, {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        whatsappNumber: user.whatsappNumber,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      errorResponse(res, "Invalid credentials", 401);
    }
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
const verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    successResponse(res, user);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { fullName, profileImage } = req.body;

    const user = await User.findById(req.user.id);

    // Auto-fix role if it's the admin email but role is wrong (migration fix)
    if (user.email === "samkiel.dev@gmail.com" && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    successResponse(res, {
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      whatsappNumber: user.whatsappNumber,
      profileImage: user.profileImage,
      role: user.role,
    });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

module.exports = {
  register,
  login,
  verifyToken,
  updateProfile,
};
