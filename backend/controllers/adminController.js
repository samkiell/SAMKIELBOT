const Deployment = require("../models/Deployment");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const pterodactyl = require("../utils/pterodactyl");
const { successResponse, errorResponse } = require("../utils/response");

// @desc    Get all deployed bots (Admin Only)
// @route   GET /api/admin/bots
const getAllBots = async (req, res) => {
  try {
    const bots = await Deployment.find({})
      .populate("user", "email fullName")
      .sort({ createdAt: -1 });
    successResponse(res, bots);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Admin Power Actions (Start, Stop, Restart)
// @route   POST /api/admin/bots/:id/power
const controlBot = async (req, res) => {
  try {
    const { signal } = req.body; // start, stop, restart, kill
    const deployment = await Deployment.findById(req.params.id);

    if (!deployment) {
      return errorResponse(res, "Bot not found", 404);
    }

    // Call Pterodactyl
    await pterodactyl.requestPowerAction(deployment.identifier, signal);

    // Update Status Locally
    let newStatus = deployment.status;
    if (signal === "start") newStatus = "starting";
    if (signal === "stop" || signal === "kill") newStatus = "stopped";
    if (signal === "restart") newStatus = "starting";

    deployment.status = newStatus;
    await deployment.save();

    // Audit Log
    await AuditLog.create({
      adminEmail: req.user.email,
      botId: deployment._id,
      action: signal,
      details: {
        identifier: deployment.identifier,
        prevStatus: deployment.status,
      },
    });

    successResponse(res, {
      message: `Signal ${signal} sent`,
      deployment,
    });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Suspend/Unsuspend Bot
// @route   POST /api/admin/bots/:id/suspend
const suspendBot = async (req, res) => {
  try {
    const { action } = req.body; // 'suspend' or 'unsuspend'
    const deployment = await Deployment.findById(req.params.id);

    if (!deployment) return errorResponse(res, "Bot not found", 404);

    if (action === "suspend") {
      await pterodactyl.suspendServer(deployment.pterodactylId);
      deployment.status = "suspended"; // You might want to add 'suspended' to Enum if strict
    } else {
      await pterodactyl.unsuspendServer(deployment.pterodactylId);
      deployment.status = "stopped"; // Reset to stopped usually
    }

    await deployment.save();

    // Audit Log
    await AuditLog.create({
      adminEmail: req.user.email,
      botId: deployment._id,
      action: action,
    });

    successResponse(res, { message: `Bot ${action}ed` });
  } catch (error) {
    console.error("Suspend Error:", error);
    errorResponse(res, error.message, 500);
  }
};

// @desc    Force Delete Bot
// @route   DELETE /api/admin/bots/:id
const deleteBot = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);
    if (!deployment) return errorResponse(res, "Bot not found", 404);

    // Initial Audit Log (Intent)
    await AuditLog.create({
      adminEmail: req.user.email,
      botId: deployment._id,
      action: "delete-attempt",
    });

    // Delete from Pterodactyl
    if (deployment.pterodactylId) {
      try {
        await pterodactyl.deleteServer(deployment.pterodactylId);
      } catch (e) {
        console.error("Pterodactyl Delete Error (Admin):", e.message);
        // Continue to delete from DB? Yes, admin force delete.
      }
    }

    await deployment.deleteOne();

    // Final Audit Log
    await AuditLog.create({
      adminEmail: req.user.email,
      botId: deployment._id, // ID might still be valid for log even if doc deleted from collection?
      // Actually references will break if strictly checked, but for log it's just an ID.
      action: "delete-success",
      details: {
        identifier: deployment.identifier,
        finalStatus: deployment.status,
      },
    });

    successResponse(res, { message: "Bot deleted successfully" });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Get Single User Details
// @route   GET /api/admin/users/:id
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return errorResponse(res, "User not found", 404);
    successResponse(res, user);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Get Bots for a Specific User
// @route   GET /api/admin/users/:id/bots
const getUserBots = async (req, res) => {
  try {
    const bots = await Deployment.find({ user: req.params.id }).sort({
      createdAt: -1,
    });
    successResponse(res, bots);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getAllBots,
  controlBot,
  suspendBot,
  deleteBot,
  getUserDetails,
  getUserBots,
};
