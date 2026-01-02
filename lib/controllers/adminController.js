const Deployment = require("@/models/Deployment");
const User = require("@/models/User");
const AuditLog = require("@/models/AuditLog");
const Node = require("@/models/Node");
const Notification = require("../../models/Notification"); // Moved to top-level
const FeatureFlag = require("@/models/FeatureFlag");
const PaymentTransaction = require("@/models/PaymentTransaction");

const pterodactyl = require("@/lib/utils/pterodactyl");
const { successResponse, errorResponse } = require("@/lib/utils/response");
const botHealthService = require("@/lib/services/botHealthService");
const creditService = require("../services/creditService");
const infraOrchestrator = require("../services/infraOrchestrator");

// Import interaction logic for re-export or re-implementation if admin spec differs
const {
  getSuggestions,
  updateSuggestion,
  sendNotification,
} = require("./interactionsController");

// @desc    Get Server Console Info (Websocket)
// @route   GET /api/admin/server/:id/console
const getServerConsole = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);
    if (!deployment) return errorResponse(res, "Deployment not found", 404);

    if (!deployment.pterodactylUuid) {
      // Try to recover UUID from ID
      if (deployment.pterodactylId) {
        try {
          const details = await pterodactyl.getServerDetails(
            deployment.pterodactylId
          );
          deployment.pterodactylUuid = details.attributes.uuid;
          await deployment.save();
        } catch (err) {
          return errorResponse(
            res,
            "No Pterodactyl UUID and failed to recover it",
            400
          );
        }
      } else {
        return errorResponse(res, "No Pterodactyl UUID or ID", 400);
      }
    }

    const wsDetails = await pterodactyl.getWebsocketDetails(
      deployment.pterodactylUuid
    );

    successResponse(res, {
      server: deployment,
      websocket: wsDetails,
    });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Get System Health & Dashboard Stats
// @route   GET /api/admin/dashboard
const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalBots = await Deployment.countDocuments({});
    const activeBots = await Deployment.countDocuments({ isActive: true });
    const runningBots = await Deployment.countDocuments({
      status: {
        $in: ["active", "connected", "running", "online", "degraded"],
      },
    });
    const stoppedBots = await Deployment.countDocuments({ status: "stopped" });
    const failedDeploymentsToday = await Deployment.countDocuments({
      status: "failed",
      deployedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });

    // Node Health (Aggregated from local DB)
    const nodes = await Node.find({});
    const nodeHealth = nodes.map((n) => ({
      name: n.name,
      status: n.status,
      ramUsage: Math.round((n.resources.usedRam / n.resources.totalRam) * 100),
    }));

    // Audit Logs (Governance Activity)
    const auditLogs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(5);

    // Revenue Today
    const transactionsToday = await PaymentTransaction.find({
      status: "success",
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });
    const revenueToday = transactionsToday.reduce(
      (acc, t) => acc + (t.amount || 0),
      0
    );

    // Error Rates
    const errorRate =
      totalBots > 0
        ? ((failedDeploymentsToday / totalBots) * 100).toFixed(2)
        : 0;

    successResponse(res, {
      totalUsers,
      totalBots,
      activeBots,
      runningBots,
      stoppedBots,
      failedDeploymentsToday,
      nodeHealth,
      errorRate,
      auditLogs,
      revenueToday,
      userGrowth: "+12%", // Mock for UI aesthetics
      revenueGrowth: "+8%", // Mock
    });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Get all users with stats
// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      const searchRegex = new RegExp(search, "i");
      const mongoose = require("mongoose");

      const orConditions = [
        { username: searchRegex },
        { email: searchRegex },
        { fullName: searchRegex },
        { whatsappNumber: searchRegex },
      ];

      if (mongoose.Types.ObjectId.isValid(search)) {
        orConditions.push({ _id: search });
      }

      query = { $or: orConditions };
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    // Attach bot counts (could be optimized with aggregate)
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const botCount = await Deployment.countDocuments({ user: user._id });
        const deployments = await Deployment.find({ user: user._id }).select(
          "resources"
        );
        const totalRam = deployments.reduce(
          (acc, curr) => acc + (curr.resources?.ramLimit || 0),
          0
        );

        return {
          ...user.toObject(),
          credits: Math.round(user.credits),
          stats: {
            totalBots: botCount,
            totalRamUsage: totalRam,
          },
        };
      })
    );

    successResponse(res, usersWithStats);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    User Management (Status, Role, Limits)
// @route   PUT /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const { role, accountStatus, limits } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return errorResponse(res, "User not found", 404);

    if (role) user.role = role;
    if (accountStatus) user.accountStatus = accountStatus;
    if (limits) {
      if (limits.maxBots !== undefined) user.limits.maxBots = limits.maxBots;
      if (limits.maxRam !== undefined) user.limits.maxRam = limits.maxRam;
      if (limits.maxCpu !== undefined) user.limits.maxCpu = limits.maxCpu;
    }

    await user.save();

    await AuditLog.create({
      adminEmail: req.user.email,
      targetType: "User",
      targetId: user._id,
      action: "update_user",
      details: req.body,
    });

    successResponse(res, user);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Hard Delete User (Cascade)
// @route   DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, "User not found", 404);

    // Get all bots
    const bots = await Deployment.find({ user: user._id });

    // Delete all bots from Pterodactyl
    for (const bot of bots) {
      if (bot.pterodactylId) {
        try {
          await pterodactyl.deleteServer(bot.pterodactylId);
        } catch (e) {
          console.error(
            `Failed to delete Ptero server ${bot.pterodactylId}:`,
            e
          );
        }
      }
      await bot.deleteOne();
    }

    await user.deleteOne();

    await AuditLog.create({
      adminEmail: req.user.email,
      targetType: "User",
      targetId: user._id,
      action: "delete_user",
    });

    successResponse(res, {
      message: `User and ${bots.length} bots deleted successfully`,
    });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Get all deployed bots (Admin Only)
// @route   GET /api/admin/bots
const getAllBots = async (req, res) => {
  try {
    const bots = await Deployment.find({})
      .populate("user", "email fullName")
      .sort({ deployedAt: -1 });
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

    // Start health monitoring if starting/restarting
    if (signal === "start" || signal === "restart") {
      botHealthService.startMonitoring(deployment._id);
    } else if (signal === "stop" || signal === "kill") {
      botHealthService.stopMonitoring(deployment._id);
    }

    // Audit Log
    await AuditLog.create({
      adminEmail: req.user.email,
      targetType: "Deployment",
      targetId: deployment._id,
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

// @desc    Throttle Bot Resources (RAM, CPU)
// @route   POST /api/admin/bots/:id/throttle
const throttleBot = async (req, res) => {
  try {
    const { memory, cpu, disk } = req.body;
    const deployment = await Deployment.findById(req.params.id);

    if (!deployment) {
      return errorResponse(res, "Bot not found", 404);
    }

    // Update Pterodactyl
    await pterodactyl.updateServerBuild(deployment.pterodactylId, {
      memory: memory || deployment.resources.ramLimit,
      cpu: cpu || deployment.resources.cpuLimit,
      disk: disk || deployment.resources.diskLimit,
    });

    // Update Local Deployment stats
    if (memory) deployment.resources.ramLimit = memory;
    if (cpu) deployment.resources.cpuLimit = cpu;
    if (disk) deployment.resources.diskLimit = disk;

    await deployment.save();

    // Audit Log
    await AuditLog.create({
      adminEmail: req.user.email,
      targetType: "Deployment",
      targetId: deployment._id,
      action: "throttle",
      details: { memory, cpu, disk },
    });

    successResponse(res, {
      message: "Bot resources updated/throttled",
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
      deployment.status = "suspended";
    } else {
      await pterodactyl.unsuspendServer(deployment.pterodactylId);
      deployment.status = "stopped"; // Reset to stopped usually
    }

    await deployment.save();

    // Audit Log
    await AuditLog.create({
      adminEmail: req.user.email,
      targetType: "Deployment",
      targetId: deployment._id,
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
      targetType: "Deployment",
      targetId: deployment._id,
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
      targetType: "Deployment",
      targetId: deployment._id,
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

// @desc    Sync Nodes from Pterodactyl
// @route   POST /api/admin/nodes/sync
const syncNodes = async (req, res) => {
  try {
    const pteroNodes = await pterodactyl.getNodes();

    for (const pNode of pteroNodes) {
      const attrs = pNode.attributes;
      // Process servers if included in Ptero response (relationships.servers.data)
      const serversData = pNode.attributes.relationships?.servers?.data || [];
      const mappedServers = await Promise.all(
        serversData.map(async (s) => {
          // Find matching local Deployment by pterodactylId
          // Show any bot that is linked to a server, regardless of active flag
          // This ensures the admin sees all resource-consuming instances
          const localDep = await Deployment.findOne({
            pterodactylId: s.attributes.id,
            pterodactylUuid: { $exists: true, $ne: null },
          }).populate("user", "username email");

          return {
            id: s.attributes.id,
            name: s.attributes.name,
            identifier: s.attributes.identifier,
            ownerEmail:
              s.attributes.relationships?.user?.attributes?.email || "Unknown",
            memory: s.attributes.limits.memory,
            disk: s.attributes.limits.disk,
            cpu: s.attributes.limits.cpu,
            status:
              s.attributes.status ||
              (s.attributes.suspended ? "suspended" : "active"),
            deploymentId: localDep ? localDep._id : null,
          };
        })
      );

      await Node.findOneAndUpdate(
        { pterodactylId: attrs.id },
        {
          name: attrs.name,
          fqdn: attrs.fqdn,
          status: attrs.maintenance_mode ? "maintenance" : "online",
          resources: {
            totalRam: attrs.memory,
            totalCpu: attrs.cpu,
            totalDisk: attrs.disk,
            usedRam: mappedServers.reduce((acc, s) => acc + s.memory, 0), // Calc from limits
            usedDisk: mappedServers.reduce((acc, s) => acc + s.disk, 0),
          },
          serverCount: mappedServers.length,
          servers: mappedServers,
        },
        { upsert: true, new: true }
      );
    }

    const allNodes = await Node.find({});
    successResponse(res, allNodes);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Get Node Details
// @route   GET /api/admin/nodes/:id
const getNode = async (req, res) => {
  try {
    const node = await Node.findById(req.params.id);
    if (!node) return errorResponse(res, "Node not found", 404);
    successResponse(res, node);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Get Nodes
// @route   GET /api/admin/nodes
const getNodes = async (req, res) => {
  try {
    const nodes = await Node.find({});
    successResponse(res, nodes);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Get Audit Logs
// @route   GET /api/admin/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    // Enrich with usernames
    const emails = [...new Set(logs.map((log) => log.adminEmail))];
    const users = await User.find({ email: { $in: emails } }).select(
      "email username"
    );

    const userMap = {};
    users.forEach((u) => {
      userMap[u.email] = u.username;
    });

    const logsWithUsernames = logs.map((log) => ({
      ...log,
      adminUsername: userMap[log.adminEmail] || log.adminEmail,
    }));

    successResponse(res, logsWithUsernames);
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
      deployedAt: -1,
    });
    successResponse(res, bots);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Get All Feature Flags
// @route   GET /api/admin/settings/flags
const getFeatureFlags = async (req, res) => {
  try {
    const flags = await FeatureFlag.find({});
    successResponse(res, flags);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Update Feature Flag
// @route   PUT /api/admin/settings/flags/:key
const updateFeatureFlag = async (req, res) => {
  try {
    const { isEnabled, description } = req.body;
    const flag = await FeatureFlag.findOneAndUpdate(
      { key: req.params.key },
      { isEnabled, description, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    successResponse(res, flag);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Sync Server Stats (Live Resources)
// @route   POST /api/admin/bots/sync-stats
const syncServerStats = async (req, res) => {
  try {
    const bots = await Deployment.find({});
    const statsUpdates = [];

    // Parallel processing
    await Promise.all(
      bots.map(async (bot) => {
        try {
          // If no Pterodactyl ID, it might be a zombie record or pending?
          // If it has an ID, check if it exists in Ptero
          if (bot.pterodactylId) {
            try {
              // Check if server exists
              await pterodactyl.getServerDetails(bot.pterodactylId);
            } catch (err) {
              if (err.response?.status === 404) {
                console.warn(
                  `Server ${bot.botName} (ID: ${bot.pterodactylId}) returned 404 from Pterodactyl.`
                );
                // Do NOT delete automatically. It might be a permission issue or transient.
                // bot.status = "unknown";
                // await bot.save();
                // return;
              }
              // Continue to try to get UUID or Stats if possible, or just skip
            }
          }

          // Backfill UUID if missing but ID exists (re-check existence first above)
          if (!bot.pterodactylUuid && bot.pterodactylId) {
            try {
              const details = await pterodactyl.getServerDetails(
                bot.pterodactylId
              );
              bot.pterodactylUuid = details.attributes.uuid;
              await bot.save();
            } catch (err) {
              // Ignore
            }
          }

          if (!bot.pterodactylUuid) return;

          const stats = await pterodactyl.getResources(bot.pterodactylUuid);
          // stats maps to: resources: { memory_bytes, cpu_absolute, disk_bytes, ... }

          const usedRam = Math.round(
            stats.resources.memory_bytes / 1024 / 1024
          );
          const usedDisk = Math.round(stats.resources.disk_bytes / 1024 / 1024);
          const usedCpu = Math.round(stats.resources.cpu_absolute * 100) / 100;

          // Update DB
          bot.resources.usedRam = usedRam;
          bot.resources.usedDisk = usedDisk;
          bot.resources.usedCpu = usedCpu;
          bot.resources.state = stats.current_state;

          // Map Ptero state to local status if needed or just use state field
          if (stats.current_state === "running") bot.status = "running";
          else if (stats.current_state === "offline") bot.status = "stopped";
          else if (stats.current_state === "starting") bot.status = "starting";

          await bot.save();
          statsUpdates.push({ id: bot._id, success: true });
        } catch (e) {
          // If 404 on resources, it often means server is suspended or installing.
          // Do NOT delete.
          if (e.response?.status === 404) {
            // console.warn(`Resources 404 for ${bot.botName}`);
          }
          statsUpdates.push({ id: bot._id, success: false });
        }
      })
    );

    const updatedBots = await Deployment.find({})
      .populate("user", "email fullName")
      .sort({ deployedAt: -1 });

    successResponse(res, updatedBots);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Add Credits to User (Admin)
// @route   POST /api/admin/users/:id/credits
const addCreditsToUser = async (req, res) => {
  try {
    const { credits, reason } = req.body;
    const userId = req.params.id;

    if (!credits || credits === 0) {
      return errorResponse(res, "Invalid credit amount", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // creditService is imported at top level
    const isAdding = credits > 0;
    const absoluteCredits = Math.abs(credits);

    // If reducing, check if user has enough credits
    if (!isAdding && user.credits < absoluteCredits) {
      return errorResponse(
        res,
        `Cannot reduce credits. User only has ${user.credits} credits but you're trying to remove ${absoluteCredits} credits.`,
        400
      );
    }

    let newBalance;
    if (isAdding) {
      newBalance = await creditService.addCredits(
        userId,
        absoluteCredits,
        "admin_grant",
        reason || `Admin ${req.user.email} added ${absoluteCredits} credits`,
        {
          adminEmail: req.user.email,
          adminId: req.user.id,
        }
      );
    } else {
      newBalance = await creditService.deductCredits(
        userId,
        absoluteCredits,
        "admin_deduction",
        reason || `Admin ${req.user.email} removed ${absoluteCredits} credits`,
        {
          adminEmail: req.user.email,
          adminId: req.user.id,
        }
      );
    }

    // Create audit log
    await AuditLog.create({
      adminEmail: req.user.email,
      targetType: "User",
      targetId: userId,
      action: isAdding ? "add_credits" : "deduct_credits",
      details: {
        credits: absoluteCredits,
        reason,
        newBalance,
      },
    });

    // Send notification to user
    await Notification.create({
      user: userId,
      title: isAdding ? "Credits Added! 🎁" : "Credits Deducted ⚠️",
      message: isAdding
        ? `An admin has added ${absoluteCredits} credits to your account. New balance: ${Math.round(
            newBalance
          )} credits.`
        : `An admin has deducted ${absoluteCredits} credits from your account. New balance: ${Math.round(
            newBalance
          )} credits.`,
      type: isAdding ? "success" : "warning",
    });

    // Emit socket event
    const io = res.socket?.server?.io;
    if (io) {
      io.emit("credits:updated", {
        userId,
        credits: Math.round(newBalance),
      });
    }

    successResponse(res, {
      message: isAdding
        ? "Credits added successfully"
        : "Credits deducted successfully",
      credits: absoluteCredits,
      action: isAdding ? "added" : "deducted",
      newBalance: Math.round(newBalance),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[Admin] Add/deduct credits error:", error);
    errorResponse(res, error.message, 500);
  }
};

// @desc    Get User Credits and Transaction History
// @route   GET /api/admin/users/:id/credits
const getUserCredits = async (req, res) => {
  try {
    const userId = req.params.id;
    const limit = parseInt(req.query.limit) || 50;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // creditService is imported at top level
    const history = await creditService.getCreditHistory(userId, limit);
    const stats = await creditService.getCreditStats(userId);

    successResponse(res, {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
      },
      credits: Math.round(user.credits),
      referralCode: user.referralCode,
      totalReferrals: user.totalReferrals,
      stats,
      history,
    });
  } catch (error) {
    console.error("[Admin] Get user credits error:", error);
    errorResponse(res, error.message, 500);
  }
};

// @desc    Force Sync Bot Statuses from Pterodactyl
// @route   POST /api/admin/bots/sync-status
const forceSyncBotStatuses = async (req, res) => {
  try {
    console.log("[Admin] Force syncing bot statuses...");

    // Run the detection for already-running bots
    await botHealthService.detectAlreadyRunningBots();

    // Get updated bot list
    const bots = await Deployment.find({})
      .populate("user", "email fullName")
      .sort({ deployedAt: -1 });

    successResponse(res, {
      message: "Bot statuses synced successfully",
      bots,
    });
  } catch (error) {
    console.error("[Admin] Force sync error:", error);
    errorResponse(res, error.message, 500);
  }
};

// @desc    Get all notifications
// @route   GET /api/admin/notifications
const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .populate("user", "email username fullName")
      .sort({ createdAt: -1 })
      .limit(100); // Limit to last 100 to prevent overload, or implement pagination later
    successResponse(res, notifications);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/admin/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return errorResponse(res, "Notification not found", 404);
    }

    await notification.deleteOne();
    successResponse(res, { message: "Notification deleted successfully" });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Get Revenue & Credit Purchase Stats
// @route   GET /api/admin/revenue
const getRevenueStats = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      currency,
      startDate,
      endDate,
      search,
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (currency) query.currency = currency;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      // Find users matching search term to include in query
      const users = await User.find({
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { fullName: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const userIds = users.map((u) => u._id);

      query.$or = [{ reference: { $regex: search, $options: "i" } }];
      if (userIds.length > 0) {
        query.$or.push({ user: { $in: userIds } });
      }
    }

    // Aggregated Metrics (All time successful)
    const allTimeStats = await PaymentTransaction.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: "$currency",
          totalAmount: { $sum: "$amount" },
          totalCredits: { $sum: "$creditsGranted" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Time-based calculations
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayRevenue, weekRevenue, monthRevenue] = await Promise.all([
      PaymentTransaction.aggregate([
        { $match: { status: "success", createdAt: { $gte: startOfToday } } },
        { $group: { _id: "$currency", total: { $sum: "$amount" } } },
      ]),
      PaymentTransaction.aggregate([
        { $match: { status: "success", createdAt: { $gte: startOfWeek } } },
        { $group: { _id: "$currency", total: { $sum: "$amount" } } },
      ]),
      PaymentTransaction.aggregate([
        { $match: { status: "success", createdAt: { $gte: startOfMonth } } },
        { $group: { _id: "$currency", total: { $sum: "$amount" } } },
      ]),
    ]);

    // Fetch transactions with pagination
    const transactions = await PaymentTransaction.find(query)
      .populate("user", "username email fullName")
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const totalTransactionsCount = await PaymentTransaction.countDocuments(
      query
    );

    successResponse(res, {
      summary: {
        allTime: allTimeStats,
        today: todayRevenue,
        week: weekRevenue,
        month: monthRevenue,
      },
      transactions,
      pagination: {
        total: totalTransactionsCount,
        page: parseInt(page),
        pages: Math.ceil(totalTransactionsCount / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("[Admin Revenue] Error:", error);
    errorResponse(res, error.message, 500);
  }
};

const getInfraOverview = async (req, res) => {
  try {
    const liveState = await infraOrchestrator.getLiveState();
    if (!liveState) {
      // Return a valid skeleton structure instead of null/pending object
      // This prevents 'undefined' errors in the UI before first poll
      return successResponse(res, {
        status: "pending",
        message: "Synchronizing with DigitalOcean...",
        name: "Connecting...",
        host: {
          cpu: { usedPercent: 0, cores: 1 },
          memory: {
            usedMB: 0,
            totalMB: 1024,
            usedPercent: 0,
            breakdown: { botsMB: 0, systemMB: 0 },
          },
          disk: { usedGB: 0, totalGB: 25, usedPercent: 0 },
        },
        bots: [],
        prediction: { status: "calculating" },
      });
    }
    successResponse(res, liveState);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getRevenueStats,

  getSystemStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllBots,
  controlBot,
  suspendBot,
  deleteBot,
  syncNodes,
  getNodes,
  getAuditLogs,
  getUserDetails,
  getUserBots,
  getFeatureFlags,
  updateFeatureFlag,
  getSuggestions,
  updateSuggestion,
  sendNotification,
  getServerConsole,
  getNode,
  syncServerStats,
  addCreditsToUser,
  getUserCredits,
  forceSyncBotStatuses,
  getAllNotifications,
  deleteNotification,
  getRevenueStats,
  getInfraOverview,
  throttleBot,
};
