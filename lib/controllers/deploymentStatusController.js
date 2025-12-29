const Deployment = require("../../models/Deployment");
const { successResponse, errorResponse } = require("../utils/response");
const botHealthService = require("../services/botHealthService");
const creditService = require("../services/creditService");

// @desc    Get deployment status by ID
// @route   GET /api/deployments/:id/status
// @access  Private
const getDeploymentStatus = async (req, res) => {
  try {
    let deployment = await Deployment.findById(req.params.id).populate(
      "user",
      "fullName email credits username"
    );

    if (!deployment) {
      return errorResponse(res, "Deployment not found", 404);
    }

    const ownerId = deployment.user._id
      ? deployment.user._id.toString()
      : deployment.user.toString();
    if (ownerId !== req.user.id && req.user.role !== "admin") {
      return errorResponse(res, "Not authorized", 401);
    }

    // Proactive Billing Check: If renewal is due, process it now
    if (deployment.nextRenewalAt && deployment.nextRenewalAt <= new Date()) {
      await creditService.processBotRenewal(deployment._id);
      deployment = await Deployment.findById(req.params.id).populate(
        "user",
        "fullName email credits username"
      );
    }

    // Lazy Sync: If bot is in a state where we expect progress but have no pairing code, or if it's online but lacks resources
    // try to force a one-off sync from the logs/resources. This helps on serverless builds (Vercel).
    const needsSync =
      (["starting", "creating", "installing"].includes(deployment.status) &&
        !deployment.pairingCode) ||
      (["online", "active", "connected"].includes(deployment.status) &&
        (!deployment.uptimeStart || !deployment.resources?.uptimeMs));

    if (needsSync) {
      // For the first visit or stale data, we await a short sync to ensure UI is fresh.
      await botHealthService.syncBotState(deployment._id);
      // Also trigger a health check to get raw resources
      deployment = await Deployment.findById(req.params.id).populate(
        "user",
        "fullName email credits username"
      );
    }

    // Return the full deployment object
    successResponse(res, deployment);
  } catch (error) {
    console.error("[DeploymentStatus] Error:", error);
    errorResponse(res, error.message, 500);
  }
};

// @desc    Get all active bots
// @route   GET /api/deployments/active
// @access  Private
const getActiveBots = async (req, res) => {
  try {
    const activeBots = await Deployment.find({
      user: req.user.id,
      isActive: true,
      status: { $in: ["active", "connected", "online", "degraded"] },
    }).select("botName botNumber status isActive lastActiveAt connectedAt");

    successResponse(res, activeBots);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Update bot heartbeat
// @route   POST /api/deployments/heartbeat
// @access  Internal (Bot Secret)
const botHeartbeat = async (req, res) => {
  try {
    const { deploymentId, instanceId, restartCount } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bot ")) {
      return errorResponse(res, "Missing bot authentication", 401);
    }

    const secret = authHeader.split(" ")[1];
    if (secret !== process.env.INTERNAL_BOT_SECRET) {
      return errorResponse(res, "Invalid bot secret", 401);
    }

    if (!deploymentId) {
      return errorResponse(res, "Deployment ID is required", 400);
    }

    const deployment = await Deployment.findById(deploymentId);
    if (!deployment) {
      return errorResponse(res, "Deployment not found", 404);
    }

    // Update heartbeat data
    deployment.lastHeartbeatAt = new Date();
    deployment.lastActiveAt = new Date();
    deployment.instanceId = instanceId || deployment.instanceId;

    // If bot reports a restart count, we check if it changed
    if (
      restartCount !== undefined &&
      restartCount > (deployment.restartCount || 0)
    ) {
      deployment.restartCount = restartCount;
      console.log(
        `[Heartbeat] Bot ${deployment.botName} restarted (Count: ${restartCount})`
      );
    }

    // If bot was offline, mark as active/connected
    if (deployment.status === "offline") {
      deployment.status = "connected";
      deployment.isActive = true;
    }

    await deployment.save();

    successResponse(res, { status: deployment.status }, "Heartbeat received");
  } catch (error) {
    console.error("[BotHeartbeat] Error:", error);
    errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getDeploymentStatus,
  getActiveBots,
  botHeartbeat,
};
