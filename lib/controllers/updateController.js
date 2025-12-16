const Deployment = require('../models/Deployment');
const { successResponse, errorResponse } = require('../utils/response');

// @desc    Update bot version from GitHub
// @route   POST /api/update
// @access  Private
const updateBot = async (req, res) => {
  try {
    const { deploymentId, newVersion } = req.body;

    const deployment = await Deployment.findById(deploymentId);

    if (!deployment) {
      return errorResponse(res, 'Deployment not found', 404);
    }

    // Check if user owns the deployment
    if (deployment.user.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized', 401);
    }

    // Simulate update process (in real app, fetch from GitHub and update)
    deployment.version = newVersion;
    deployment.updatedAt = Date.now();
    await deployment.save();

    successResponse(res, deployment);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Get update history
// @route   GET /api/update/:deploymentId
// @access  Private
const getUpdateHistory = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.deploymentId);

    if (!deployment) {
      return errorResponse(res, 'Deployment not found', 404);
    }

    // Check if user owns the deployment
    if (deployment.user.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized', 401);
    }

    // For now, return the deployment (in real app, maintain update history)
    successResponse(res, deployment);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

module.exports = {
  updateBot,
  getUpdateHistory,
};
