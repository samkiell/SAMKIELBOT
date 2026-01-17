/**
 * Audit Logger Utility
 * Provides proper actor attribution for all logged actions
 * Fix: Issue #3 - Admin Dashboard Activity Logs Misattribution
 */

const AuditLog = require("../../models/AuditLog");

/**
 * Create an audit log entry with proper actor attribution
 * @param {Object} req - Express request object
 * @param {Object} options - Log options
 * @returns {Promise<Object|null>} - Created log entry or null on error
 */
const createAuditLog = async (req, options) => {
  const {
    action,
    category = "system",
    targetType,
    targetId,
    targetName = null,
    details = {},
    previousState = null,
    newState = null,
    source = "web",
    systemActor = false, // For cron/webhook without user context
  } = options;

  try {
    // Extract actor info from request
    let actorEmail, actorRole, actorId;

    if (systemActor || !req.user) {
      // System/Cron/Webhook actions without user context
      actorEmail = "system@samkielbot.app";
      actorRole = "system";
      actorId = null;
    } else {
      // Normal user/admin actions
      actorEmail = req.user.email || "unknown";
      actorRole = req.user.role || "user";
      actorId = req.user.id || req.user._id;
    }

    // Extract IP address (handle proxies)
    const ipAddress =
      req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.headers?.["x-real-ip"] ||
      req.socket?.remoteAddress ||
      "unknown";

    // Create the log entry using the EXISTING schema structure
    // Note: We're adapting to the current schema which uses adminEmail
    // A migration can be done later to use the new schema
    const logEntry = await AuditLog.create({
      adminEmail: actorEmail, // Using existing field (will be renamed in schema migration)
      targetType,
      targetId,
      action,
      ipAddress,
      details: {
        ...details,
        // Store additional actor info in details for now
        actorRole,
        actorId: actorId?.toString(),
        category,
        targetName,
        previousState,
        newState,
        source,
        userAgent: req.headers?.["user-agent"]?.substring(0, 200),
      },
    });

    return logEntry;
  } catch (error) {
    console.error("[AuditLogger] Failed to create audit log:", error.message);
    // Don't throw - audit logging should not break primary operations
    return null;
  }
};

/**
 * Shorthand for admin actions
 * @param {Object} req - Express request object
 * @param {string} action - Action name (e.g., "update_user", "delete_bot")
 * @param {Object} target - Target info { type, id, name }
 * @param {Object} details - Additional context
 */
const logAdminAction = (req, action, target, details = {}) => {
  return createAuditLog(req, {
    action,
    category: "admin",
    targetType: target.type,
    targetId: target.id,
    targetName: target.name,
    details,
    source: "web",
  });
};

/**
 * Shorthand for user actions (deployment, billing, etc.)
 * @param {Object} req - Express request object
 * @param {string} action - Action name (e.g., "create_deployment", "start_bot")
 * @param {Object} target - Target info { type, id, name }
 * @param {Object} details - Additional context
 */
const logUserAction = (req, action, target, details = {}) => {
  return createAuditLog(req, {
    action,
    category: "deployment",
    targetType: target.type,
    targetId: target.id,
    targetName: target.name,
    details,
    source: "web",
  });
};

/**
 * Shorthand for system/automated actions (cron, webhooks)
 * @param {string} action - Action name
 * @param {Object} target - Target info { type, id, name }
 * @param {Object} details - Additional context
 */
const logSystemAction = (action, target, details = {}) => {
  return createAuditLog(
    { headers: {} }, // Empty request mock
    {
      action,
      category: "system",
      targetType: target.type,
      targetId: target.id,
      targetName: target.name,
      details,
      source: "cron",
      systemActor: true,
    },
  );
};

/**
 * Shorthand for authentication actions
 * @param {Object} req - Express request object
 * @param {string} action - Action name (e.g., "login", "logout", "register")
 * @param {Object} target - Target info { type: "User", id, name }
 * @param {Object} details - Additional context
 */
const logAuthAction = (req, action, target, details = {}) => {
  return createAuditLog(req, {
    action,
    category: "auth",
    targetType: target.type || "User",
    targetId: target.id,
    targetName: target.name,
    details,
    source: "web",
  });
};

/**
 * Shorthand for billing/payment actions
 * @param {Object} req - Express request object
 * @param {string} action - Action name (e.g., "purchase_credits", "daily_renewal")
 * @param {Object} target - Target info { type, id, name }
 * @param {Object} details - Additional context including amounts
 */
const logBillingAction = (req, action, target, details = {}) => {
  return createAuditLog(req, {
    action,
    category: "billing",
    targetType: target.type,
    targetId: target.id,
    targetName: target.name,
    details,
    source: req ? "web" : "cron",
  });
};

module.exports = {
  createAuditLog,
  logAdminAction,
  logUserAction,
  logSystemAction,
  logAuthAction,
  logBillingAction,
};
