const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const Subscription = require("../../models/Subscription"); // Added for Tier Gating
const Plan = require("../../models/Plan"); // Added for Tier Gating
const Notification = require("../../models/Notification"); // Moved to top-level
const creditService = require("../services/creditService"); // Moved to top-level
const { sendOTPInternal } = require("./otpController"); // Moved to top-level
const { successResponse, errorResponse } = require("../utils/response");
const { generateOTP, hashOTP, verifyOTP } = require("../utils/otpUtils");
const { sendOTPEmail } = require("../services/emailService");

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
    const {
      fullName,
      username,
      email,
      whatsappNumber,
      password,
      referredByUsername,
    } = req.body;

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

    // Validate referrer if provided
    let referrer = null;
    if (referredByUsername) {
      referrer = await User.findOne({
        username: referredByUsername.toLowerCase().trim(),
      });

      // Prevent self-referral
      if (referrer && referrer.username === username.toLowerCase().trim()) {
        return errorResponse(res, "You cannot refer yourself", 400);
      }

      if (!referrer) {
        console.log(
          `[Referral] Invalid referrer username: ${referredByUsername}`
        );
        // Don't fail registration, just ignore invalid referral
        referrer = null;
      }
    }

    // Create user
    const user = await User.create({
      fullName,
      username,
      email,
      whatsappNumber,
      password,
      role: email === "admin@samkielbot.app" ? "admin" : "user",
      referredBy: referrer ? referrer._id : null,
    });

    // Process referral rewards - MOVED TO OTP VERIFICATION
    if (referrer && user) {
      // Notification that referral is pending verification
      try {
        await Notification.create({
          user: user._id,
          title: "Referral Bonus Pending ⏳",
          message: `You were referred by ${referrer.username}. Verify your account to claim your 10 free credits!`,
          type: "info",
        });
      } catch (notifWarn) {
        console.warn("Failed to create pending referral notification");
      }
    }

    // Auto-Welcome Notification
    await Notification.create({
      user: user._id,
      title: "🎉 Welcome to SAMKIEL BOT!",
      message: "Join our WhatsApp channel for updates and announcements!",
      type: "welcome",
      link: "https://whatsapp.com/channel/0029VbAhWo3C6Zvf2t4Rne0h",
      linkText: "Join WhatsApp Channel",
    });

    // Send initial OTP automatically
    try {
      await sendOTPInternal(user._id, "email");
    } catch (otpError) {
      console.error("[OTP] Error sending initial OTP:", otpError);
    }

    if (user) {
      successResponse(res, {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        whatsappNumber: user.whatsappNumber,
        profileImage: user.profileImage,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        needsVerification: true,
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

    if (!identifier || !password) {
      return errorResponse(
        res,
        "Please enter both email/username and password.",
        400
      );
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return errorResponse(
        res,
        "No account found with this email or username.",
        401,
        "user_not_found"
      );
    }

    if (!(await user.matchPassword(password))) {
      return errorResponse(
        res,
        "Incorrect password. Please try again.",
        401,
        "invalid_password"
      );
    }

    // ✅ Check if at least one verification exists
    if (!user.isEmailVerified && !user.isPhoneVerified) {
      return successResponse(
        res,
        {
          _id: user._id,
          username: user.username,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          profileImage: user.profileImage,
          needsVerification: true,
          token: generateToken(user._id, user.role), // Still give token so they can access OTP routes
        },
        "Account needs verification. Please verify your email or phone."
      );
    }

    successResponse(res, {
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      whatsappNumber: user.whatsappNumber,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      profileImage: user.profileImage,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
const verifyToken = async (req, res) => {
  try {
    if (!req.user) return errorResponse(res, "Not authorized", 401);
    const user = await User.findById(req.user._id).select("-password");

    // Fetch active subscription with plan details
    const subscription = await Subscription.findOne({
      user: user._id,
      status: "active",
      expiresAt: { $gt: new Date() },
    }).populate("plan");

    const userObj = user.toObject();
    userObj.subscription = subscription || null;

    successResponse(res, userObj);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { fullName, profileImage, username, email } = req.body;
    console.log("[UpdateProfile] Request body:", req.body);

    if (!req.user) {
      console.warn("[UpdateProfile] No user on request");
      return errorResponse(res, "Not authorized", 401);
    }

    const user = await User.findById(req.user._id);
    console.log("[UpdateProfile] Found user:", user?.username);

    // Auto-fix role if it's the admin email but role is wrong (migration fix)
    if (user.email === "admin@samkielbot.app" && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }
    // Update fields
    if (fullName) user.fullName = fullName;
    if (profileImage !== undefined) user.profileImage = profileImage;

    // Handle Username Update
    if (username && username.trim() !== user.username) {
      const existingUser = await User.findOne({
        username: username.trim().toLowerCase(),
        _id: { $ne: user._id },
      });
      if (existingUser)
        return errorResponse(res, "Username already taken", 400);
      user.username = username.trim().toLowerCase();
    }

    // Handle Email Update
    if (email && email.trim() !== user.email) {
      const existingEmail = await User.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: user._id },
      });
      if (existingEmail) return errorResponse(res, "Email already taken", 400);
      user.email = email.trim().toLowerCase();
      user.isEmailVerified = false; // Reset verification
    }

    // Handle Phone Number Update
    if (req.body.whatsappNumber) {
      const newPhone = req.body.whatsappNumber.trim();

      // Strict Country Code Format Validation (without +)
      const phoneRegex = /^[1-9]\d{7,14}$/;
      if (!phoneRegex.test(newPhone)) {
        return errorResponse(
          res,
          "Phone number must include country code without '+' (e.g., 1234567890)",
          400
        );
      }

      // Check if number is different from current
      if (newPhone !== user.whatsappNumber) {
        // Check uniqueness
        const existingPhone = await User.findOne({
          whatsappNumber: newPhone,
          _id: { $ne: user._id }, // Exclude current user
        });

        if (existingPhone) {
          return errorResponse(
            res,
            "This WhatsApp number is already in use by another account.",
            400
          );
        }

        user.whatsappNumber = newPhone;
        // Optional: Reset phone verification status if you have it
        if (user.isPhoneVerified) {
          user.isPhoneVerified = false;
        }
      }
    }

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

// @desc    Validate referrer username
// @route   GET /api/auth/validate-referrer/:username
// @access  Public
const validateReferrer = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({
      username: username.toLowerCase().trim(),
    });

    if (!user) {
      return errorResponse(res, "Referrer not found", 404);
    }

    successResponse(res, {
      username: user.username,
      exists: true,
    });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return errorResponse(res, "Email is required", 400);

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // For security, don't reveal if user exists or not, but the user said they need this to work.
      // Usually we say "If an account exists, an email has been sent".
      return errorResponse(res, "User with this email does not exist", 404);
    }

    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.otp = {
      code: hashedOtp,
      expiresAt,
      type: "password_reset",
      attempts: 0,
    };
    await user.save();

    await sendOTPEmail(user.email, otp, "Password Reset OTP");

    successResponse(res, null, "Password reset OTP sent to your email");
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return errorResponse(res, "All fields are required", 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.otp || user.otp.type !== "password_reset") {
      return errorResponse(res, "No active password reset request found", 400);
    }

    if (new Date() > user.otp.expiresAt) {
      return errorResponse(res, "OTP has expired", 400);
    }

    const isValid = await verifyOTP(otp, user.otp.code);
    if (!isValid) {
      user.otp.attempts += 1;
      await user.save();

      const remaining = 2 - user.otp.attempts;
      if (remaining <= 0) {
        user.otp = undefined; // Invalidate OTP
        await user.save();
        return errorResponse(
          res,
          "Too many failed attempts. OTP invalidated.",
          400
        );
      }
      return errorResponse(
        res,
        `Invalid OTP. ${remaining} attempts remaining.`,
        400
      );
    }

    // Reset password
    user.password = newPassword;
    user.otp = undefined;
    await user.save();

    successResponse(
      res,
      null,
      "Password reset successfully. You can now login."
    );
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Change Password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return errorResponse(
        res,
        "Both current and new passwords are required",
        400
      );
    }

    const user = await User.findById(req.user._id);
    if (!user) return errorResponse(res, "User not found", 404);

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return errorResponse(res, "Incorrect current password", 400);

    user.password = newPassword;
    await user.save();

    successResponse(res, null, "Password changed successfully");
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

module.exports = {
  register,
  login,
  verifyToken,
  updateProfile,
  validateReferrer,
  forgotPassword,
  resetPassword,
  changePassword,
};
