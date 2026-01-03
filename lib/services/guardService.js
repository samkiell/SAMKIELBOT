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
    // 1. Max bots per user (Hard limit: 2)
    const botCount = await Deployment.countDocuments({ user: userId });
    if (botCount >= 2) {
      loggerService.log(
        "deployments.log",
        `BLOCKED: User ${userId} - Reason: bot_limit (${botCount} bots already)`
      );
      return {
        allowed: false,
        message:
          "You have reached the maximum limit of 2 bots per account. Please delete an existing bot to deploy a new one.",
        reason: "bot_limit",
      };
    }

    // 2. Global node resource guard (Min 500MB unallocated RAM)
    const nodes = await pterodactyl.getNodes();

    // We check the first available node as the current deployment logic
    // consistently picks the first node (see lib/utils/pterodactyl.js:findNode)
    const node = nodes[0];

    if (!node) {
      loggerService.log(
        "deployments.log",
        `BLOCKED: User ${userId} - Reason: no_nodes`
      );
      return {
        allowed: false,
        message:
          "No deployment nodes are currently available. Please contact support.",
        reason: "no_nodes",
      };
    }

    const { memory, allocated_memory, name } = node.attributes;
    const freeMemory = memory - allocated_memory;

    if (freeMemory < 500) {
      loggerService.log(
        "deployments.log",
        `BLOCKED: User ${userId} - Reason: resource_limit (Node: ${name}, Free: ${freeMemory}MB)`
      );
      return {
        allowed: false,
        message:
          "The system is currently at capacity (low available RAM). Please try again in a few minutes.",
        reason: "resource_limit",
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
