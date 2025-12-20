const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const { errorResponse } = require("./response");

/**
 * Protect middleware for Next.js API routes
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @param {Function} handler - Async function to execute if authenticated
 */
const protect = async (req, res, handler) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return errorResponse(res, "User no longer exists", 401);
      }

      // Execute the handler
      return await handler(req, res);
    } catch (error) {
      return errorResponse(res, "Not authorized, token failed", 401);
    }
  }

  if (!token) {
    return errorResponse(res, "Not authorized, no token", 401);
  }
};

/**
 * Admin middleware for Next.js API routes
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @param {Function} handler - Async function to execute if admin
 */
const admin = async (req, res, handler) => {
  if (req.user && req.user.role === "admin") {
    return await handler(req, res);
  } else {
    return errorResponse(res, "Not authorized as an admin", 403);
  }
};

module.exports = { protect, admin };
