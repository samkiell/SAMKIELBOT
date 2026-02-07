const Deployment = require("../../models/Deployment");
const User = require("../../models/User");
const AuditLog = require("../../models/AuditLog");
const Node = require("../../models/Node");
const Notification = require("../../models/Notification"); // Moved to top-level
const FeatureFlag = require("../../models/FeatureFlag");
const PaymentTransaction = require("../../models/PaymentTransaction");

const pterodactyl = require("../utils/pterodactyl");
const { successResponse, errorResponse } = require("../utils/response");
const botHealthService = require("../services/botHealthService");
const creditService = require("../services/creditService");
const infraOrchestrator = require("../services/infraOrchestrator");
const { logAdminAction, logSystemAction } = require("../utils/auditLogger");

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
            deployment.pterodactylId,
          );
          deployment.pterodactylUuid = details.attributes.uuid;
          await deployment.save();
        } catch (err) {
          return errorResponse(
            res,
            "No Pterodactyl UUID and failed to recover it",
            400,
          );
        }
      } else {
        return errorResponse(res, "No Pterodactyl UUID or ID", 400);
      }
    }

    const wsDetails = await pterodactyl.getWebsocketDetails(
      deployment.pterodactylUuid,
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
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const heartbeatThreshold = new Date(Date.now() - 5 * 60 * 1000);

    const totalUsers = await User.countDocuments({});
    const totalBots = await Deployment.countDocuments({});
    const activeBots = await Deployment.countDocuments({ isActive: true });

    // WhatsApp Active: Process is running AND (status is online/connected OR recent heartbeat)
    const waActiveBots = await Deployment.countDocuments({
      $and: [
        { "resources.state": "running" },
        {
          $or: [
            { status: { $in: ["online", "active", "connected"] } },
            { lastHeartbeatAt: { $gte: heartbeatThreshold } },
          ],
        },
      ],
    });

    // Server Idle: Process is running but NOT WhatsApp connected
    const runningBots = await Deployment.countDocuments({
      "resources.state": "running",
    });

    const idleBots = Math.max(0, runningBots - waActiveBots);

    const stoppedBots = await Deployment.countDocuments({ status: "stopped" });
    const failedDeploymentsToday = await Deployment.countDocuments({
      status: "failed",
      deployedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });

    // Node Health (Aggregated from local DB) - Only Node 3 (Requirement 5)
    const nodes = await Node.find({ pterodactylId: 3 });
    const nodeHealth = nodes.map((n) => ({
      id: n.pterodactylId,
      name: n.name,
      status: n.status,
      totalRam: n.resources.totalRam,
      allocatedRam: n.resources.usedRam,
      freeRam: Math.max(0, n.resources.totalRam - n.resources.usedRam),
      ramUsage:
        Math.round((n.resources.usedRam / n.resources.totalRam) * 100) || 0,
      totalCpu: n.resources.totalCpu,
    }));

    // Audit Logs (Governance Activity)
    const auditLogs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(5);

    // Revenue Today
    const transactionsToday = await PaymentTransaction.find({
      status: "success",
      createdAt: { $gte: startOfToday },
    });
    const revenueToday = transactionsToday.reduce(
      (acc, t) => acc + (t.amount || 0),
      0,
    );

    // Revenue Yesterday for Growth
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const transactionsYesterday = await PaymentTransaction.find({
      status: "success",
      createdAt: { $gte: startOfYesterday, $lt: startOfToday },
    });
    const revenueYesterday = transactionsYesterday.reduce(
      (acc, t) => acc + (t.amount || 0),
      0,
    );

    // Revenue Growth Calculation
    let revenueGrowth = 0;
    if (revenueYesterday > 0) {
      revenueGrowth =
        ((revenueToday - revenueYesterday) / revenueYesterday) * 100;
    } else if (revenueToday > 0) {
      revenueGrowth = 100;
    }

    // User Growth
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: startOfToday },
    });
    const newUsersYesterday = await User.countDocuments({
      createdAt: { $gte: startOfYesterday, $lt: startOfToday },
    });

    let userGrowth = 0;
    if (newUsersYesterday > 0) {
      userGrowth =
        ((newUsersToday - newUsersYesterday) / newUsersYesterday) * 100;
    } else if (newUsersToday > 0) {
      userGrowth = 100;
    }

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
      waActiveBots,
      idleBots,
      stoppedBots,
      failedDeploymentsToday,
      nodeHealth,
      errorRate,
      auditLogs,
      revenueToday,
      userGrowth: (userGrowth >= 0 ? "+" : "") + userGrowth.toFixed(0) + "%",
      revenueGrowth:
        (revenueGrowth >= 0 ? "+" : "") + revenueGrowth.toFixed(0) + "%",
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
          "resources",
        );
        const totalAllocatedRam = deployments.reduce(
          (acc, curr) => acc + (curr.resources?.ramLimit || 0),
          0,
        );
        const totalUsedRam = deployments.reduce(
          (acc, curr) => acc + (curr.resources?.usedRam || 0),
          0,
        );

        return {
          ...user.toObject(),
          credits: Math.round(user.credits),
          stats: {
            totalBots: botCount,
            totalRamUsage: totalUsedRam,
            totalRamAllocated: totalAllocatedRam,
          },
        };
      }),
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

    // Audit Log with proper actor attribution (Fix: Issue #3)
    await logAdminAction(
      req,
      "update_user",
      {
        type: "User",
        id: user._id,
        name: user.email,
      },
      {
        changes: req.body,
      },
    );

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
            e,
          );
        }
      }
      await bot.deleteOne();
    }

    await user.deleteOne();

    // Audit Log with proper actor attribution (Fix: Issue #3)
    await logAdminAction(
      req,
      "delete_user",
      {
        type: "User",
        id: user._id,
        name: user.email,
      },
      {
        botsDeleted: bots.length,
      },
    );

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

    // Audit Log with proper actor attribution (Fix: Issue #3)
    await logAdminAction(
      req,
      `power_${signal}`,
      {
        type: "Deployment",
        id: deployment._id,
        name: deployment.botName,
      },
      {
        identifier: deployment.identifier,
        prevStatus: deployment.status,
        newStatus,
      },
    );

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

    // Audit Log with proper actor attribution (Fix: Issue #3)
    await logAdminAction(
      req,
      "throttle_bot",
      {
        type: "Deployment",
        id: deployment._id,
        name: deployment.botName,
      },
      { memory, cpu, disk },
    );

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

    // Audit Log with proper actor attribution (Fix: Issue #3)
    await logAdminAction(
      req,
      action,
      {
        type: "Deployment",
        id: deployment._id,
        name: deployment.botName,
      },
      { previousStatus: deployment.status },
    );

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

    // Store bot info before deletion for audit
    const botInfo = {
      botName: deployment.botName,
      identifier: deployment.identifier,
      status: deployment.status,
    };

    // Initial Audit Log (Intent) with proper attribution
    await logAdminAction(
      req,
      "delete_bot_attempt",
      {
        type: "Deployment",
        id: deployment._id,
        name: deployment.botName,
      },
      botInfo,
    );

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

    // Final Audit Log with proper attribution
    await logAdminAction(
      req,
      "delete_bot_success",
      {
        type: "Deployment",
        id: deployment._id,
        name: botInfo.botName,
      },
      {
        identifier: botInfo.identifier,
        finalStatus: botInfo.status,
      },
    );

    successResponse(res, { message: "Bot deleted successfully" });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Sync Nodes from Pterodactyl
// @route   POST /api/admin/nodes/sync
const syncNodes = async (req, res) => {
  try {
    const allPteroNodes = await pterodactyl.getNodes();
    const pteroNodes = allPteroNodes.filter((n) => n.attributes.id === 3);
    console.log(`[Admin] Syncing Node 3 from Pterodactyl...`);

    // Cleanup old nodes (Requirement 5)
    await Node.deleteMany({ pterodactylId: { $ne: 3 } });

    for (const pNode of pteroNodes) {
      const attrs = pNode.attributes;

      // Get allocated resources from Pterodactyl
      const allocatedRam = attrs.allocated_resources
        ? attrs.allocated_resources.memory
        : 0;
      const allocatedDisk = attrs.allocated_resources
        ? attrs.allocated_resources.disk
        : 0;

      // Process servers if included in Ptero response
      const serversData = attrs.relationships?.servers?.data || [];
      const mappedServers = await Promise.all(
        serversData.map(async (s) => {
          const localDep = await Deployment.findOne({
            pterodactylId: s.attributes.id,
          }).select("_id botName");

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
        }),
      );

      await Node.findOneAndUpdate(
        { pterodactylId: attrs.id },
        {
          name: attrs.name,
          fqdn: attrs.fqdn,
          status: attrs.maintenance_mode ? "maintenance" : "online",
          resources: {
            totalRam: attrs.memory,
            totalCpu: attrs.cpu, // Store actual node CPU limit
            totalDisk: attrs.disk,
            usedRam: allocatedRam, // This is ALLOCATED RAM (logical boundary)
            usedDisk: allocatedDisk,
          },
          serverCount: mappedServers.length,
          servers: mappedServers,
          lastHeartbeat: new Date(),
        },
        { upsert: true, new: true },
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
    const {
      category,
      role,
      targetType,
      action,
      startDate,
      endDate,
      limit = 100,
    } = req.query;

    const query = {};

    // Filter by targetType if provided
    if (targetType) query.targetType = targetType;

    // Filter by action (partial match)
    if (action) query.action = { $regex: action, $options: "i" };

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    // Enrich with usernames and proper role attribution
    const emails = [...new Set(logs.map((log) => log.adminEmail))];
    const users = await User.find({ email: { $in: emails } }).select(
      "email username role",
    );

    const userMap = {};
    users.forEach((u) => {
      userMap[u.email] = {
        username: u.username,
        email: u.email,
        role: u.role,
      };
    });

    // Format logs with proper actor attribution (Fix: Issue #3)
    const logsWithAttribution = logs.map((log) => {
      const userInfo = userMap[log.adminEmail];

      // Extract role from details if stored there (new logger), otherwise from user lookup
      const actorRole = log.details?.actorRole || userInfo?.role || "user";
      const category = log.details?.category || "system";
      const targetName = log.details?.targetName || null;

      // Determine if this is truly an admin action or a user action
      const isAdmin = actorRole === "admin";
      const isSystem =
        actorRole === "system" || log.adminEmail === "system@samkielbot.app";

      return {
        _id: log._id,
        timestamp: log.timestamp,

        // Actor information with proper attribution
        actor: {
          email: log.adminEmail,
          username: userInfo?.username || log.adminEmail.split("@")[0],
          role: actorRole,
          isAdmin,
          isSystem,
          ipAddress: log.ipAddress || log.details?.ipAddress || null,
        },

        // Target information
        target: {
          type: log.targetType,
          id: log.targetId,
          name: targetName,
        },

        // Action details
        action: log.action,
        category,
        details: log.details || {},

        // Legacy field for backwards compatibility
        adminEmail: log.adminEmail,
        adminUsername: userInfo?.username || log.adminEmail,

        // Human-readable summary
        summary: generateActionSummary(log, userInfo, actorRole),
      };
    });

    // Apply post-query filters (if role filter provided)
    let filteredLogs = logsWithAttribution;
    if (role) {
      filteredLogs = logsWithAttribution.filter(
        (log) => log.actor.role === role,
      );
    }
    if (category) {
      filteredLogs = filteredLogs.filter((log) => log.category === category);
    }

    successResponse(res, filteredLogs);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// Helper function to generate human-readable action summaries
const generateActionSummary = (log, userInfo, actorRole) => {
  const actorName =
    actorRole === "system"
      ? "System"
      : actorRole === "admin"
        ? `Admin ${userInfo?.username || "Unknown"}`
        : `User ${
            userInfo?.username || log.adminEmail?.split("@")[0] || "Unknown"
          }`;

  const targetName = log.details?.targetName || log.targetId || "resource";

  return `${actorName} performed ${log.action} on ${log.targetType} "${targetName}"`;
};

// @desc    Get Single User Details
// @route   GET /api/admin/users/:id
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("referredBy", "username email");
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
      { new: true, upsert: true },
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
                  `Server ${bot.botName} (ID: ${bot.pterodactylId}) returned 404 from Pterodactyl.`,
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
                bot.pterodactylId,
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
            stats.resources.memory_bytes / 1024 / 1024,
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
      }),
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
        400,
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
        },
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
        },
      );
    }

    // Create audit log with proper actor attribution (Fix: Issue #3)
    await logAdminAction(
      req,
      isAdding ? "add_credits" : "deduct_credits",
      {
        type: "User",
        id: userId,
        name: user.email,
      },
      {
        credits: absoluteCredits,
        reason,
        newBalance,
        previousBalance: user.credits,
      },
    );

    // Send notification to user
    await Notification.create({
      user: userId,
      title: isAdding ? "Credits Added! 🎁" : "Credits Deducted ⚠️",
      message: isAdding
        ? `An admin has added ${absoluteCredits} credits to your account. New balance: ${Math.round(
            newBalance,
          )} credits.`
        : `An admin has deducted ${absoluteCredits} credits from your account. New balance: ${Math.round(
            newBalance,
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

// @desc    Bill Bot Arrears (Fix Under-billing)
// @route   POST /api/admin/bots/:id/bill-arrears
const billBotArrears = async (req, res) => {
  try {
    const { amount } = req.body;
    const botId = req.params.id;

    if (!amount || amount <= 0) {
      return errorResponse(res, "Invalid amount", 400);
    }

    const bot = await Deployment.findById(botId).populate("user");
    if (!bot) return errorResponse(res, "Bot not found", 404);
    if (!bot.user) return errorResponse(res, "Bot owner not found", 404);

    const user = bot.user;

    // Deduct credits from user
    const newBalance = await creditService.deductCredits(
      user._id,
      amount,
      "billing_correction",
      `Arrears collection for bot: ${bot.botName}`,
      { deployment: bot._id, adminId: req.user.id },
    );

    // Update bot spent credits
    bot.totalCreditsSpent = (bot.totalCreditsSpent || 0) + amount;
    await bot.save();

    // Audit Log
    await logAdminAction(
      req,
      "bill_bot_arrears",
      { type: "Deployment", id: bot._id, name: bot.botName },
      { amount, newBalance, userId: user._id },
    );

    // Notify user
    await Notification.create({
      user: user._id,
      title: "Billing Correction 💳",
      message: `An admin has collected ${amount} credits in arrears for your bot "${bot.botName}". New balance: ${Math.round(
        newBalance,
      )} credits.`,
      type: "warning",
    });

    successResponse(res, {
      message: "Arrears collected successfully",
      amount,
      newBalance: Math.round(newBalance),
      totalCreditsSpent: bot.totalCreditsSpent,
    });
  } catch (error) {
    console.error("[Admin] Bill arrears error:", error);
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
    const { search, type, userId } = req.query;
    let query = {};

    // 1. Search Query (Title/Message)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    // 2. Type Filter
    if (type && type !== "all") {
      query.type = type;
    }

    // 3. User Filter
    if (userId) {
      // If filtering by specific user
      query.user = userId;
    } else if (req.query.userSearch) {
      // If filtering by username search text
      const users = await User.find({
        $or: [
          { username: { $regex: req.query.userSearch, $options: "i" } },
          { email: { $regex: req.query.userSearch, $options: "i" } },
        ],
      }).select("_id");
      // If users found, look for notifications for these users OR broadcast (null) depending on intent
      // However, admin likely wants to see specific target notifications
      const userIds = users.map((u) => u._id);
      if (userIds.length > 0) {
        // We combine this with existing query.$or if present
        if (query.$or) {
          query.$and = [{ $or: query.$or }, { user: { $in: userIds } }];
          delete query.$or;
        } else {
          query.user = { $in: userIds };
        }
      } else {
        // No users found matching search, return empty (or just broadcasts if desired? lets stay strict)
        return successResponse(res, []);
      }
    }

    // 4. Fetch with population
    // Removed hard limit, using basic sort for now as requested "show all"
    // Ideally we should still limit but maybe to 1000 or implement pagination
    const notifications = await Notification.find(query)
      .populate("user", "email username fullName")
      .sort({ createdAt: -1 });
    // .limit(500); // Optional: Safety cap if 'all' is truly massive

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
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayRevenue, yesterdayRevenue, weekRevenue, monthRevenue] =
      await Promise.all([
        PaymentTransaction.aggregate([
          { $match: { status: "success", createdAt: { $gte: startOfToday } } },
          { $group: { _id: "$currency", total: { $sum: "$amount" } } },
        ]),
        PaymentTransaction.aggregate([
          {
            $match: {
              status: "success",
              createdAt: { $gte: startOfYesterday, $lt: startOfToday },
            },
          },
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

    const totalTransactionsCount =
      await PaymentTransaction.countDocuments(query);

    successResponse(res, {
      summary: {
        allTime: allTimeStats,
        today: todayRevenue,
        yesterday: yesterdayRevenue,
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

const refreshInfraOverview = async (req, res) => {
  try {
    await infraOrchestrator.poll();
    const liveState = await infraOrchestrator.getLiveState();
    successResponse(res, liveState);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Get User Referrals
// @route   GET /api/admin/users/:id/referrals
const getUserReferrals = async (req, res) => {
  try {
    const referrals = await User.find({ referredBy: req.params.id })
      .select("fullName username email createdAt credits")
      .sort({ createdAt: -1 });
    successResponse(res, referrals);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// ========================================
// EMAIL BROADCAST CONTROLLER FUNCTIONS
// ========================================

const emailBroadcastService = require("../services/emailBroadcastService");

// @desc    Send Email Broadcast to all verified users
// @route   POST /api/admin/email-broadcast
// @access  Admin only
const sendEmailBroadcast = async (req, res) => {
  try {
    const {
      subject,
      message,
      announcementType,
      priority,
      batchSize,
      batchDelay,
    } = req.body;

    // Validation
    if (!subject || !subject.trim()) {
      return errorResponse(res, "Subject is required", 400);
    }
    if (!message || !message.trim()) {
      return errorResponse(res, "Message is required", 400);
    }
    if (subject.trim().length > 200) {
      return errorResponse(res, "Subject cannot exceed 200 characters", 400);
    }

    // Log the admin action
    await logAdminAction(
      req,
      "email_broadcast_initiated",
      { type: "EmailBroadcast", name: subject.trim().substring(0, 50) },
      { subject: subject.trim() },
    );

    // Send the broadcast
    const result = await emailBroadcastService.sendEmailBroadcast({
      senderId: req.user._id,
      subject: subject.trim(),
      message: message.trim(),
      announcementType: announcementType || "general",
      priority: priority || "normal",
      batchSize: batchSize || emailBroadcastService.DEFAULT_BATCH_SIZE,
      batchDelay: batchDelay || emailBroadcastService.DEFAULT_BATCH_DELAY,
    });

    // Log completion
    await logAdminAction(
      req,
      "email_broadcast_finished",
      { type: "EmailBroadcast", id: result.broadcastId, name: subject.trim() },
      { stats: result.stats, status: result.status },
    );

    successResponse(res, result, "Email broadcast process executed");
  } catch (error) {
    console.error("[Admin] Email broadcast error:", error);
    errorResponse(res, error.message, 500);
  }
};

// @desc    Resume a partial Email Broadcast
// @route   POST /api/admin/email-broadcast/resume
// @access  Admin only
const resumeEmailBroadcast = async (req, res) => {
  try {
    const { broadcastId, batchSize, batchDelay } = req.body;

    if (!broadcastId) {
      return errorResponse(res, "Broadcast ID is required", 400);
    }

    const broadcast = await emailBroadcastService.getBroadcastById(broadcastId);
    if (!broadcast) {
      return errorResponse(res, "Broadcast not found", 404);
    }

    if (broadcast.status === "completed") {
      return errorResponse(res, "Broadcast is already completed", 400);
    }

    // Log the admin action
    await logAdminAction(
      req,
      "email_broadcast_resume_initiated",
      { type: "EmailBroadcast", id: broadcastId, name: broadcast.subject },
      {},
    );

    // Resume the broadcast
    const result = await emailBroadcastService.sendEmailBroadcast({
      broadcastId,
      senderId: req.user._id,
      batchSize: batchSize || broadcast.batchSize,
      batchDelay: batchDelay || broadcast.batchDelay,
    });

    // Log completion
    await logAdminAction(
      req,
      "email_broadcast_resume_finished",
      {
        type: "EmailBroadcast",
        id: result.broadcastId,
        name: broadcast.subject,
      },
      { stats: result.stats, status: result.status },
    );

    successResponse(res, result, "Email broadcast resume process executed");
  } catch (error) {
    console.error("[Admin] Email broadcast resume error:", error);
    errorResponse(res, error.message, 500);
  }
};

// @desc    Get Email Broadcast History
// @route   GET /api/admin/email-broadcast
// @access  Admin only
const getEmailBroadcastHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const result = await emailBroadcastService.getBroadcastHistory({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
    });

    successResponse(res, result);
  } catch (error) {
    console.error("[Admin] Get broadcast history error:", error);
    errorResponse(res, error.message, 500);
  }
};

// @desc    Get Single Email Broadcast Details
// @route   GET /api/admin/email-broadcast/:id
// @access  Admin only
const getEmailBroadcastDetails = async (req, res) => {
  try {
    const broadcast = await emailBroadcastService.getBroadcastById(
      req.params.id,
    );

    if (!broadcast) {
      return errorResponse(res, "Broadcast not found", 404);
    }

    successResponse(res, broadcast);
  } catch (error) {
    console.error("[Admin] Get broadcast details error:", error);
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
  billBotArrears,
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
  refreshInfraOverview,
  getUserReferrals,
  throttleBot,
  // Email Broadcast
  sendEmailBroadcast,
  resumeEmailBroadcast,
  getEmailBroadcastHistory,
  getEmailBroadcastDetails,
};
