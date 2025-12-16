const Deployment = require("../models/Deployment");
const { successResponse, errorResponse } = require("../utils/response");

// @desc    Get deployment status by ID
// @route   GET /api/deployments/:id/status
// @access  Private
const getDeploymentStatus = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);

    if (!deployment) {
      return errorResponse(res, "Deployment not found", 404);
    }

    if (deployment.user.toString() !== req.user.id) {
      return errorResponse(res, "Not authorized", 401);
    }

    successResponse(res, {
      id: deployment._id,
      status: deployment.status,
      isActive: deployment.isActive,
      pairingCode: deployment.pairingCode,
      lastActiveAt: deployment.lastActiveAt,
      pairedAt: deployment.pairedAt,
      connectedAt: deployment.connectedAt,
      uptimeStart: deployment.uptimeStart,
      resources: deployment.resources,
      errorMessage: deployment.errorMessage,
    });
  } catch (error) {
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
      status: { $in: ["active", "connected"] },
    }).select("botName botNumber status isActive lastActiveAt connectedAt");

    successResponse(res, activeBots);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getDeploymentStatus,
  getActiveBots,
};
