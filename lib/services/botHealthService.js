const WebSocket = require("ws");
const Deployment = require("../../models/Deployment");
const Notification = require("../../models/Notification");
const pterodactyl = require("../utils/pterodactyl");
const EventEmitter = require("events");
const loggerService = require("./loggerService");

class BotHealthService extends EventEmitter {
  constructor() {
    super();
    this.activeMonitors = new Map();
    this.healthCheckInterval = 60000; // 1 minute
    this.logActivityThreshold = 180000; // 3 minutes
  }

  // Start monitoring a bot
  async startMonitoring(deploymentId) {
    try {
      const deployment = await Deployment.findById(deploymentId);
      if (!deployment || !deployment.identifier) {
        console.error(
          `Cannot monitor deployment ${deploymentId}: missing data`
        );
        return;
      }

      // Stop existing monitor if any
      this.stopMonitoring(deploymentId);

      console.log(`[BotHealth] Starting monitor for ${deployment.identifier}`);

      const monitor = {
        deploymentId,
        identifier: deployment.identifier,
        ws: null,
        healthTimer: null,
        lastLogActivity: Date.now(),
        activityCounter: 0,
      };

      // Start WebSocket log monitoring
      this.connectWebSocket(monitor);

      // Start periodic health checks
      // Trigger initial check immediately
      this.performHealthCheck(deploymentId);

      monitor.healthTimer = setInterval(() => {
        this.performHealthCheck(deploymentId);
      }, this.healthCheckInterval);

      this.activeMonitors.set(deploymentId.toString(), monitor);
    } catch (error) {
      console.error(`[BotHealth] Error starting monitor:`, error.message);
    }
  }

  // Connect to Pterodactyl WebSocket for log monitoring
  async connectWebSocket(monitor) {
    try {
      console.log(
        `[BotHealth] Getting WS details for ${monitor.identifier}...`
      );
      const { token, socket } = await pterodactyl.getWebsocketDetails(
        monitor.identifier
      );
      console.log(`[BotHealth] Connecting WS for ${monitor.identifier}...`);

      const ws = new WebSocket(socket, {
        origin: process.env.PTERODACTYL_DOMAIN || "https://panel.samkiel.dev",
      });

      ws.on("open", () => {
        console.log(`[BotHealth] WS Open for ${monitor.identifier}`);
        ws.send(JSON.stringify({ event: "auth", args: [token] }));
      });

      ws.on("message", (data) => {
        const msgStr = data.toString();
        // Limit log noise
        if (msgStr.length > 200) {
          // console.log ...
        }

        this.handleLogMessage(monitor, data);
      });

      ws.on("error", (err) => {
        console.error(
          `[BotHealth] WS Error for ${monitor.identifier}:`,
          err.message
        );
      });

      ws.on("close", () => {
        // Attempt reconnect after delay
        setTimeout(() => {
          const activeMonitor = this.activeMonitors.get(
            monitor.deploymentId.toString()
          );
          if (activeMonitor) {
            this.connectWebSocket(activeMonitor);
          }
        }, 5000);
      });

      monitor.ws = ws;
    } catch (error) {
      console.error(`[BotHealth] WS connection error:`, error.message);
    }
  }

  // Handle incoming log messages
  async handleLogMessage(monitor, data) {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.event === "auth success") {
        monitor.ws.send(JSON.stringify({ event: "send logs", args: [null] }));
      }

      if (msg.event === "console output") {
        const logLine = this.stripAnsi(msg.args[0]);
        monitor.lastLogActivity = Date.now();
        monitor.activityCounter = (monitor.activityCounter || 0) + 1;

        // Log to file
        this.logToFile(monitor.identifier, logLine);

        // Emit log
        this.emit("bot.log", {
          deploymentId: monitor.deploymentId
            ? monitor.deploymentId.toString()
            : null,
          log: logLine,
        });

        // Parse for state transitions
        await this.parseLogForStateChange(monitor.deploymentId, logLine);
      }

      // Handle status updates from Pterodactyl (if any)
      if (msg.event === "status") {
        const status = msg.args[0]; // running, starting, stopping, offline
        if (status === "starting") {
          await this.transitionState(monitor.deploymentId, "starting");
        }
      }
    } catch (error) {
      // Ignore
    }
  }

  // Parse log line for bot lifecycle events
  async parseLogForStateChange(deploymentId, logLine) {
    const deployment = await Deployment.findById(deploymentId);
    if (!deployment) return;

    const log = logLine.toLowerCase();

    // 1. FATAL ERROR / CRASH (Highest Priority)
    if (
      /process exited|fatal error|uncaught exception|address already in use/i.test(
        log
      )
    ) {
      console.log(`[BotHealth] Fatal error detected: ${deployment.botName}`);
      await this.transitionState(deploymentId, "error", {
        errorMessage: logLine.substring(0, 500),
        isActive: false,
      });
      return;
    }

    // 2. PAIRING CODE
    const pairingRegex =
      /(?:pair|code|linking)\s*[:\s-]*\s*([A-Z0-9]{4}-[A-Z0-9]{4})/i;
    const pairingMatch = logLine.match(pairingRegex);
    if (pairingMatch && pairingMatch[1]) {
      const code = pairingMatch[1];
      await this.transitionState(deploymentId, "awaiting_pairing", {
        pairingCode: code,
      });
      this.emit("bot.pairing_code", {
        deploymentId: deploymentId.toString(),
        code,
      });

      // Ensure accurate code in DB
      if (deployment.pairingCode !== code) {
        await Deployment.findByIdAndUpdate(deploymentId, { pairingCode: code });
      }
      return;
    }

    // 3. ONLINE (Verified Connection)
    // Core Baileys/WhiskeySocket connection events
    if (
      /connection status: open/i.test(log) ||
      /successfully logged in/i.test(log) ||
      /bot connected successfully/i.test(log) ||
      /client ready/i.test(log)
    ) {
      console.log(`[BotHealth] Bot ONLINE: ${deployment.botName}`);
      await this.transitionState(deploymentId, "online", {
        connectedAt: new Date(),
        uptimeStart: deployment.uptimeStart || new Date(),
        pairingCode: null, // Clear code once connected
        isActive: true,
        lastActiveAt: new Date(),
        "resources.state": "running",
      });
      this.emit("bot.connected", { deploymentId });
      return;
    }

    // 4. DEGRADED (Connection Issues)
    if (
      /connection status: connecting/i.test(log) ||
      /reconnecting/i.test(log) ||
      /connection lost/i.test(log) ||
      /timed out/i.test(log)
    ) {
      // Only downgrade if we were previously online or degraded
      if (["online", "degraded"].includes(deployment.status)) {
        console.log(`[BotHealth] Bot DEGRADED: ${deployment.botName}`);
        await this.transitionState(deploymentId, "degraded", {
          isActive: true, // Still running, just issues
        });
      }
      return;
    }

    // 5. OFFLINE (Explicit Disconnect)
    if (
      /connection status: close/i.test(log) ||
      /disconnected from whatsapp/i.test(log) ||
      /logged out/i.test(log)
    ) {
      // Check if it's a restart or permanent
      if (/reason: (?!restart)/i.test(log)) {
        // If not a restart (e.g. banned, logged out)
        console.log(`[BotHealth] Bot OFFLINE: ${deployment.botName}`);
        await this.transitionState(deploymentId, "offline", {
          isActive: false,
        });
        this.emit("bot.offline", { deploymentId });
      } else {
        // If it's a restart, maybe DEGRADED or STARTING?
        // Let's go to DEGRADED temporarily
        await this.transitionState(deploymentId, "degraded", {
          isActive: true,
        });
      }
      return;
    }

    // 6. ONLINE (Activity Inference)
    // If we missed the connection log but see activity
    if (
      /message received|command|processing|handling|\[auto-react\]/i.test(log)
    ) {
      if (deployment.status !== "online") {
        console.log(
          `[BotHealth] Bot inferred ONLINE (Activity): ${deployment.botName}`
        );
        await this.transitionState(deploymentId, "online", {
          isActive: true,
          lastActiveAt: new Date(),
          uptimeStart: deployment.uptimeStart || new Date(),
          connectedAt: deployment.connectedAt || new Date(),
        });
      } else {
        // Just update activity timestamp
        await Deployment.findByIdAndUpdate(deploymentId, {
          lastActiveAt: new Date(),
        });
      }
      return;
    }

    // 7. STARTING (Inference)
    if (/starting samkiel bot|initializing/i.test(log)) {
      if (
        ["offline", "stopped", "error", "failed"].includes(deployment.status)
      ) {
        await this.transitionState(deploymentId, "starting");
      }
    }
  }

  // Transition bot to new state
  async transitionState(deploymentId, newStatus, additionalFields = {}) {
    try {
      const deployment = await Deployment.findById(deploymentId);
      if (!deployment) return;

      const oldStatus = deployment.status;

      // Prevent invalid transitions
      if (oldStatus === newStatus) return;

      console.log(
        `[BotHealth] State transition: ${oldStatus} → ${newStatus} (${deployment.identifier})`
      );

      // Prepare update fields
      const updateFields = {
        status: newStatus,
        updatedAt: new Date(),
        ...additionalFields,
      };

      // Update resources.state based on status
      if (["online", "active", "connected", "paired"].includes(newStatus)) {
        updateFields["resources.state"] = "running";
      } else if (newStatus === "starting") {
        updateFields["resources.state"] = "starting";
      } else if (
        ["stopped", "offline", "failed", "error"].includes(newStatus)
      ) {
        updateFields["resources.state"] = "offline";
      } else if (newStatus === "degraded") {
        updateFields["resources.state"] = "running"; // It's running but degraded
      }

      // Calculate uptime if bot is active
      if (["active", "connected", "online", "degraded"].includes(newStatus)) {
        if (deployment.uptimeStart) {
          const uptimeMs =
            Date.now() - new Date(deployment.uptimeStart).getTime();
          const uptimeMinutes = Math.floor(uptimeMs / 60000);
          updateFields["usageStats.uptimeMinutes"] = uptimeMinutes;
        }
      }

      await Deployment.findByIdAndUpdate(deploymentId, updateFields, {
        new: true,
      });

      this.emit("bot.status_change", {
        deploymentId,
        oldStatus,
        newStatus,
      });
    } catch (error) {
      console.error(`[BotHealth] State transition error:`, error.message);
    }
  }

  // Perform periodic health check
  async performHealthCheck(deploymentId) {
    try {
      const deployment = await Deployment.findById(deploymentId);
      if (!deployment || !deployment.identifier) return;

      // Check server power state
      const resources = await pterodactyl.getResources(deployment.identifier);
      const serverState = resources.attributes.current_state;
      const uptimeMilliseconds = resources.attributes.resources.uptime || 0;

      // Prepare update fields (Converted to MB to match Schema ramLimit/diskLimit)
      const updateFields = {
        "resources.state": serverState,
        "resources.usedRam": Math.round(
          resources.attributes.resources.memory_bytes / 1024 / 1024
        ),
        "resources.usedCpu": resources.attributes.resources.cpu_absolute,
        "resources.usedDisk": Math.round(
          resources.attributes.resources.disk_bytes / 1024 / 1024
        ),
        lastHeartbeatAt: new Date(),
        lastActiveAt: new Date(),
      };

      // Store uptime from Pterodactyl (convert milliseconds to minutes for compatibility)
      const uptimeMinutes = Math.floor(uptimeMilliseconds / 60000);
      updateFields["usageStats.uptimeMinutes"] = uptimeMinutes;

      // Also store the raw uptime in milliseconds for real-time display
      updateFields["resources.uptimeMs"] = uptimeMilliseconds;
      updateFields["resources.lastUptimeUpdate"] = new Date();

      // Detect restart: If new uptime is significantly less than previous uptime (e.g., dropped by more than 1 minute)
      // or if previous uptime was missing but server is running.
      if (
        deployment.resources &&
        deployment.resources.uptimeMs > uptimeMilliseconds + 60000 &&
        serverState === "running"
      ) {
        console.log(
          `[BotHealth] Detected restart for ${deployment.botName} (Uptime reset)`
        );
        // Transition to starting if not already
        await this.transitionState(deploymentId, "starting", {
          uptimeStart: new Date(),
          restartCount: (deployment.restartCount || 0) + 1,
        });
        updateFields["uptimeStart"] = new Date();
        updateFields["restartCount"] = (deployment.restartCount || 0) + 1;
      }

      // Update resource usage and stats history
      const monitorObject = this.activeMonitors.get(deploymentId.toString());
      const activityCount = monitorObject
        ? monitorObject.activityCounter || 0
        : 0;
      if (monitorObject) monitorObject.activityCounter = 0; // Reset for next interval

      await Deployment.findByIdAndUpdate(deploymentId, {
        ...updateFields,
        $push: {
          "usageStats.cpuInfos": {
            $each: [resources.attributes.resources.cpu_absolute],
            $slice: -24,
          },
          "usageStats.ramInfos": {
            $each: [
              Math.round(
                resources.attributes.resources.memory_bytes / 1024 / 1024
              ),
            ],
            $slice: -24,
          },
          "usageStats.activityInfos": {
            $each: [activityCount],
            $slice: -24,
          },
        },
      });

      // Emit stats update for real-time UI
      this.emit("bot.stats", {
        deploymentId: deploymentId.toString(),
        status: serverState,
        usageStats: {
          uptimeMinutes: uptimeMinutes,
          cpuInfos: deployment.usageStats?.cpuInfos || [],
          ramInfos: deployment.usageStats?.ramInfos || [],
          activityInfos: deployment.usageStats?.activityInfos || [],
        },
        resources: {
          uptimeMs: uptimeMilliseconds,
          usedRam: resources.attributes.resources.memory_bytes,
          usedCpu: resources.attributes.resources.cpu_absolute,
          usedDisk: resources.attributes.resources.disk_bytes,
          state: serverState,
        },
      });

      // Check if server is offline
      if (serverState === "offline" || serverState === "stopping") {
        if (
          !["stopped", "offline", "failed", "error", "suspended"].includes(
            deployment.status
          )
        ) {
          await this.transitionState(deploymentId, "offline", {
            isActive: false,
            lastActiveAt: new Date(),
          });
        }
      }

      // Check if server is running but status is offline/error (Recovery)
      if (serverState === "running") {
        // Graceful Recovery: If we are marked offline but Ptero says running, check logs/uptime
        if (
          ["offline", "stopped", "failed", "error"].includes(deployment.status)
        ) {
          // Only recover if we have recent heartbeat
          // Move to STARTING to re-evaluate
          await this.transitionState(deploymentId, "starting");
        }
      }

      // Check for stale activity
      const monitor = this.activeMonitors.get(deploymentId.toString());
      if (monitor) {
        const timeSinceLog = Date.now() - monitor.lastLogActivity;
        // If online but no logs for long time?
        if (
          timeSinceLog > this.logActivityThreshold &&
          deployment.status === "online"
        ) {
          // Warning? Or maybe just keep online if heartbeat is fine.
          // User said: "If no WhatsApp activity + disconnect log detected ? downgrade"
          // We rely on logs.
        }
      }
    } catch (error) {
      console.error(
        `[BotHealth] Health check error for ${deploymentId}:`,
        error.response?.data || error.message
      );
    }
  }

  // Stop monitoring a bot
  stopMonitoring(deploymentId) {
    const key = deploymentId.toString();
    const monitor = this.activeMonitors.get(key);

    if (monitor) {
      if (monitor.ws) {
        monitor.ws.close();
      }
      if (monitor.healthTimer) {
        clearInterval(monitor.healthTimer);
      }
      this.activeMonitors.delete(key);
      console.log(`[BotHealth] Stopped monitoring ${key}`);
    }
  }

  // Force sync bot state by checking recent logs (useful for Vercel/Serverless where monitor might die)
  async syncBotState(deploymentId) {
    try {
      const deployment = await Deployment.findById(deploymentId);
      if (!deployment || !deployment.identifier) return;

      console.log(
        `[BotHealth] Lazy syncing state for ${deployment.botName}...`
      );

      const wsDetails = await pterodactyl.getWebsocketDetails(
        deployment.identifier
      );

      return new Promise((resolve) => {
        const ws = new WebSocket(wsDetails.socket, {
          origin: process.env.PTERODACTYL_DOMAIN || "https://panel.samkiel.dev",
        });

        const timeout = setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) ws.close();
          resolve(false);
        }, 8000); // 8 second max sync window

        ws.on("open", () => {
          ws.send(JSON.stringify({ event: "auth", args: [wsDetails.token] }));
        });

        ws.on("message", async (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.event === "auth success") {
            ws.send(JSON.stringify({ event: "send logs", args: [null] }));
          }
          if (msg.event === "console output") {
            const logLine = this.stripAnsi(msg.args[0]);
            await this.parseLogForStateChange(deploymentId, logLine);
          }
        });

        ws.on("close", () => {
          clearTimeout(timeout);
          resolve(true);
        });
      });
    } catch (error) {
      console.error(
        `[BotHealth] Sync error for ${deploymentId}:`,
        error.message
      );
      return false;
    }
  }

  // Send success notification
  async sendSuccessNotification(deployment) {
    try {
      await Notification.create({
        user: deployment.user,
        title: "Bot Deployed Successfully 🚀",
        message: `Your bot "${deployment.botName}" is now live and connected to WhatsApp!`,
        type: "success",
      });
    } catch (error) {
      console.error(`[BotHealth] Notification error:`, error.message);
    }
  }

  // Utility: Strip ANSI codes
  stripAnsi(str) {
    return str.replace(
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
      ""
    );
  }

  // Utility: Log to file
  logToFile(identifier, logLine) {
    loggerService.log("bot-health.log", `${identifier}: ${logLine}`);
  }

  // Get all active bots
  async getActiveBots() {
    return await Deployment.find({
      isActive: true,
      status: { $in: ["active", "connected"] },
    }).populate("user", "username email");
  }

  // Reconcile monitors: ensure all bots that should be running have a monitor
  async reconcileMonitors() {
    try {
      const runningBots = await Deployment.find({
        status: {
          $in: [
            "starting",
            "awaiting_pairing",
            "paired",
            "connected",
            "active",
            "online",
            "degraded",
          ],
        },
      });

      let started = 0;
      for (const bot of runningBots) {
        const id = bot._id.toString();
        if (!this.activeMonitors.has(id)) {
          console.log(
            `[BotHealth] Reconciling: Starting missing monitor for ${bot.botName} (${id})`
          );
          await this.startMonitoring(bot._id);
          started++;
        }
      }

      if (started > 0) {
        console.log(`[BotHealth] Reconciled ${started} monitors.`);
      }
    } catch (error) {
      console.error(`[BotHealth] Reconcile error:`, error.message);
    }
  }

  // Initialize monitoring for all running bots
  async initializeAllMonitors() {
    try {
      const runningBots = await Deployment.find({
        status: {
          $in: [
            "starting",
            "awaiting_pairing",
            "paired",
            "connected",
            "active",
            "online", // Added
            "degraded", // Added
          ],
        },
      });

      console.log(
        `[BotHealth] Initializing monitors for ${runningBots.length} bots`
      );

      for (const bot of runningBots) {
        await this.startMonitoring(bot._id);
      }

      // Also check for bots that might be running but have wrong status
      // await this.detectAlreadyRunningBots();
    } catch (error) {
      console.error(`[BotHealth] Init error:`, error.message);
    }
  }

  // Detect and update status for bots that are already running in Pterodactyl
  async detectAlreadyRunningBots() {
    try {
      console.log("[BotHealth] Checking for already-running bots...");

      const allBots = await Deployment.find({
        pterodactylUuid: { $exists: true, $ne: null },
      });

      for (const bot of allBots) {
        try {
          // Check server state
          const resources = await pterodactyl.getResources(bot.pterodactylUuid);
          const serverState = resources.attributes.current_state;

          if (serverState === "running") {
            // Server is running, check if bot status needs update
            // We check if it's marked as offline/stopped OR if it's stuck in starting/creating
            // OR if it's active but we just want to verify connectivity
            if (
              bot.status === "offline" ||
              bot.status === "stopped" ||
              bot.status === "starting" ||
              bot.status === "creating" ||
              bot.status === "installing" ||
              !bot.isActive
            ) {
              console.log(
                `[BotHealth] Inspecting running bot with doubtful status: ${bot.botName} [${bot.status}]`
              );

              // Get recent console logs to check bot state
              const wsDetails = await pterodactyl.getWebsocketDetails(
                bot.pterodactylUuid
              );

              const WebSocket = require("ws");
              const ws = new WebSocket(wsDetails.socket, {
                origin:
                  process.env.PTERODACTYL_DOMAIN || "https://panel.samkiel.dev",
              });

              ws.on("open", () => {
                ws.send(
                  JSON.stringify({ event: "auth", args: [wsDetails.token] })
                );
              });

              ws.on("message", async (data) => {
                try {
                  const msg = JSON.parse(data.toString());

                  if (msg.event === "auth success") {
                    ws.send(
                      JSON.stringify({ event: "send logs", args: [null] })
                    );
                  }

                  if (msg.event === "console output") {
                    const logLine = this.stripAnsi(msg.args[0]);

                    // 1. Check for Active Connection
                    if (
                      /connected to|client ready|bot connected|session restored/i.test(
                        logLine
                      )
                    ) {
                      console.log(
                        `[BotHealth] Auto-detected active bot (Connection Log): ${bot.botName}`
                      );
                      await this.forceUpdateStatus(bot._id, "active");
                      ws.close();
                    }
                    // 2. Check for Activity (Messages/Commands)
                    else if (
                      /message received|command executed|processing message|handling command|📝 Command used in|\[AUTO-REACT\] Triggered/i.test(
                        logLine
                      )
                    ) {
                      console.log(
                        `[BotHealth] Auto-detected active bot (Activity Log): ${bot.botName}`
                      );
                      await this.forceUpdateStatus(bot._id, "active");
                      ws.close();
                    }
                    // 3. Check for Pairing Code
                    else {
                      const pairingRegex =
                        /Your Pairing Code\s*:\s*([A-Z0-9]{4}-[A-Z0-9]{4})/i;
                      const match = logLine.match(pairingRegex);
                      if (match && match[1]) {
                        console.log(
                          `[BotHealth] Auto-detected pairing code: ${bot.botName} -> ${match[1]}`
                        );
                        await Deployment.findByIdAndUpdate(bot._id, {
                          status: "awaiting_pairing",
                          pairingCode: match[1],
                          "resources.state": "running",
                        });
                        // Don't close WS yet, maybe we find connection log later?
                        // Actually, if it's waiting for pairing, it's not connected.
                        // So we can monitor normally.
                        await this.startMonitoring(bot._id);
                        ws.close();
                      }
                    }
                  }
                } catch (err) {
                  // Ignore parse errors
                }
              });

              // Close after checking logs (timeout to allow log replay)
              setTimeout(() => {
                if (ws.readyState === 1) {
                  ws.close();
                }
              }, 8000);

              // Ensure we start monitoring regardless, if it's running
              if (!this.activeMonitors.has(bot._id.toString())) {
                await this.startMonitoring(bot._id);
              }
            }
          } else if (serverState === "offline" || serverState === "stopping") {
            // Server is offline, make sure bot status reflects this
            if (bot.status !== "offline" && bot.status !== "stopped") {
              await Deployment.findByIdAndUpdate(bot._id, {
                status: "offline",
                isActive: false,
                lastActiveAt: new Date(),
                "resources.state": "offline",
              });
            }
          }
        } catch (err) {
          // Skip bots that error (might be deleted from Pterodactyl)
          if (err.response?.status === 404) {
            await Deployment.findByIdAndUpdate(bot._id, {
              status: "failed",
              isActive: false,
              errorMessage: "Server not found in Pterodactyl",
            });
          }
        }
      }

      console.log("[BotHealth] Already-running bot detection complete");
    } catch (error) {
      console.error(
        `[BotHealth] Error detecting already-running bots:`,
        error.message
      );
    }
  }

  // Helper to force update status
  async forceUpdateStatus(deploymentId, status) {
    await Deployment.findByIdAndUpdate(deploymentId, {
      status: status,
      isActive: true,
      connectedAt: new Date(),
      uptimeStart: new Date(),
      lastActiveAt: new Date(),
      "resources.state": "running",
    });
    await this.startMonitoring(deploymentId);
  }

  // Detect bots that haven't sent a heartbeat recently
  async checkStaleHeartbeats() {
    try {
      console.log("[BotHealth] Checking for stale heartbeats...");
      const threshold = new Date(Date.now() - 3 * 60 * 1000); // 3 minutes

      const staleBots = await Deployment.find({
        status: { $in: ["active", "connected", "paired", "running"] },
        isActive: true,
        lastHeartbeatAt: { $lt: threshold },
      });

      if (staleBots.length > 0) {
        console.log(
          `[BotHealth] Found ${staleBots.length} stale bots. Marking as offline.`
        );
        for (const bot of staleBots) {
          await this.transitionState(bot._id, "offline", {
            isActive: false,
            errorMessage: "Heartbeat timeout (3 minutes missing)",
          });
          this.emit("bot.offline", { deploymentId: bot._id });
        }
      }
    } catch (error) {
      console.error("[BotHealth] Stale heartbeat check error:", error.message);
    }
  }
  // Send command to bot terminal via Pterodactyl WebSocket
  async sendCommandToBot(deploymentId, command) {
    try {
      const monitor = this.activeMonitors.get(deploymentId.toString());
      if (monitor && monitor.ws && monitor.ws.readyState === WebSocket.OPEN) {
        monitor.ws.send(
          JSON.stringify({ event: "send command", args: [command] })
        );
        console.log(
          `[BotHealth] Command sent to ${monitor.identifier}: ${command}`
        );
      } else {
        // Fallback: If WS is not open, use API
        const deployment = await Deployment.findById(deploymentId);
        if (deployment && deployment.identifier) {
          await pterodactyl.sendCommand(deployment.identifier, command);
          console.log(
            `[BotHealth] Command sent to ${deployment.identifier} via API: ${command}`
          );
        } else {
          throw new Error("Bot not found or not active.");
        }
      }
    } catch (error) {
      console.error(
        `[BotHealth] Error sending command to bot ${deploymentId}:`,
        error.message
      );
      throw error;
    }
  }
}

// Singleton instance
const botHealthService = new BotHealthService();

module.exports = botHealthService;
