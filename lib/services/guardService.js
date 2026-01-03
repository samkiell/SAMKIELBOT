const Deployment = require("../../models/Deployment");
const pterodactyl = require("../utils/pterodactyl");
const loggerService = require("./loggerService");

/**
 * Validates if a user is allowed to deploy a new bot based on operational limits.
 * @param {string} userId - The ID of the user attempting to deploy.
 * @returns {Promise<{allowed: boolean, message?: string, reason?: string}>}
 */
const canDeployBot = async (userId) => {
  try {
    // 1. Max bots per user (Hard limit: 2) (Requirement 3)
    const botCount = await Deployment.countDocuments({ user: userId });
    if (botCount >= 2) {
      loggerService.log(
        "deployments.log",
        `BLOCKED: User ${userId} - Reason: bot_limit (${botCount} bots already)`
      );
      return {
        allowed: false,
        message: "You’ve reached the maximum number of bots for your account.",
        reason: "bot_limit",
      };
    }

    // 2. Node 3 Safety Guard (Requirement 2)
    try {
      const health = await pterodactyl.checkNodeHealth(3);

      if (health.isOverloaded) {
        loggerService.log(
          "deployments.log",
          `BLOCKED: User ${userId} - Reason: resource_limit (Node 3 Overloaded: RAM ${health.ramUsage.toFixed(
            1
          )}%, Disk ${health.diskUsage.toFixed(
            1
          )}%, CPU ${health.cpuUsage.toFixed(1)}%)`
        );
        return {
          allowed: false,
          message:
            "Server resources are currently under high load. Please try again later.",
          reason: "resource_limit",
        };
      }
    } catch (error) {
      return {
        allowed: false,
        message:
          "Deployment temporarily unavailable. Our servers are under maintenance.",
        reason: "node_offline",
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("[GuardService] error:", error.message);
    // In case of error (e.g. API down), we block deployment to prevent inconsistent states
    return {
      allowed: false,
      message:
        "An error occurred while verifying deployment limits. Please try again later.",
      reason: "internal_error",
    };
  }
};

module.exports = {
  canDeployBot,
};
