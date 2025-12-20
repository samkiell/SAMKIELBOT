const WebSocket = require("ws");
const Deployment = require("../../models/Deployment");
const Notification = require("../../models/Notification");
const pterodactyl = require("../utils/pterodactyl");
const EventEmitter = require("events");

class BotHealthService extends EventEmitter {
  constructor() {
    super();
    this.activeMonitors = new Map();
    this.healthCheckInterval = 30000; // 30 seconds
    this.logActivityThreshold = 120000; // 2 minutes
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
      };

      // Start WebSocket log monitoring
      this.connectWebSocket(monitor);

      // Start periodic health checks
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
      const { token, socket } = await pterodactyl.getWebsocketDetails(
        monitor.identifier
      );

      const ws = new WebSocket(socket, {
        origin: process.env.PTERODACTYL_DOMAIN || "https://panel.samkiel.dev",
      });

      ws.on("open", () => {
        console.log(`[BotHealth] WS Open for ${monitor.identifier}`);
        ws.send(JSON.stringify({ event: "auth", args: [token] }));
      });

      ws.on("message", (data) => {
        const msgStr = data.toString();
        // console.log(`[BotHealth] Raw message for ${monitor.identifier}: ${msgStr.substring(0, 100)}`);
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

        // Log to file for debugging
        this.logToFile(monitor.identifier, logLine);

        // Emit log line for real-time display
        this.emit("bot.log", {
          deploymentId: monitor.deploymentId.toString(),
          log: logLine,
        });

        // Parse for state transitions
        await this.parseLogForStateChange(monitor.deploymentId, logLine);
      }
    } catch (error) {
      // Ignore parse errors
    }
  }

  // Parse log line for bot lifecycle events
  async parseLogForStateChange(deploymentId, logLine) {
    const deployment = await Deployment.findById(deploymentId);
    if (!deployment) return;

    const logLower = logLine.toLowerCase();

    // 1. PAIRING CODE DETECTION
    const pairingRegex =
      /(?:Your pairing code|Pairing code|Code)\s*[:\s-]*\s*([A-Z0-9]{4}-[A-Z0-9]{4})/i;
    const pairingMatch = logLine.match(pairingRegex);

    if (pairingMatch && pairingMatch[1]) {
      const code = pairingMatch[1];
      console.log(
        `[BotHealth] Pairing code detected for ${deployment.botName}: ${code}`
      );

      // Update deployment with code and status
      await this.transitionState(deploymentId, "awaiting_pairing", {
        pairingCode: code,
      });

      // Explicitly update pairing code even if already in awaiting_pairing status
      if (
        deployment.status === "awaiting_pairing" &&
        deployment.pairingCode !== code
      ) {
        await Deployment.findByIdAndUpdate(deploymentId, { pairingCode: code });
      }

      this.emit("bot.pairing_code", {
        deploymentId: deploymentId.toString(),
        code,
      });
      return;
    }

    // 2. PAIRING COMPLETE / LOGIN SUCCESS
    const pairedPatterns = [
      /successfully logged in/i,
      /session restored/i,
      /pairing complete/i,
      /login successful/i,
    ];

    if (pairedPatterns.some((pattern) => pattern.test(logLine))) {
      console.log(`[BotHealth] Bot paired successfully`);

      await this.transitionState(deploymentId, "paired", {
        pairedAt: new Date(),
      });

      this.emit("bot.paired", { deploymentId });
      return;
    }

    // 3. CONNECTION ESTABLISHED
    const connectedPatterns = [
      /connected to whatsapp/i,
      /client ready/i,
      /bot connected successfully/i,
      /connection opened/i,
      /websocket connected/i,
    ];

    if (connectedPatterns.some((pattern) => pattern.test(logLine))) {
      console.log(`[BotHealth] Bot connected to WhatsApp`);

      await this.transitionState(deploymentId, "connected", {
        connectedAt: new Date(),
        uptimeStart: new Date(),
        isActive: true,
        lastActiveAt: new Date(),
      });

      this.emit("bot.connected", { deploymentId });

      // Send success notification
      await this.sendSuccessNotification(deployment);
      return;
    }

    // 4. BOT ACTIVE (receiving/processing messages)
    const activePatterns = [
      /message received/i,
      /command executed/i,
      /processing message/i,
      /handling command/i,
    ];

    if (
      activePatterns.some((pattern) => pattern.test(logLine)) &&
      deployment.status !== "active"
    ) {
      console.log(`[BotHealth] Bot is actively processing messages`);

      await this.transitionState(deploymentId, "active", {
        isActive: true,
        lastActiveAt: new Date(),
      });

      this.emit("bot.active", { deploymentId });
      return;
    }

    // 5. ERROR / CRASH DETECTION
    const errorPatterns = [
      /process exited/i,
      /server stopped/i,
      /fatal error/i,
      /uncaught exception/i,
      /connection closed/i,
      /disconnected from whatsapp/i,
    ];

    if (errorPatterns.some((pattern) => pattern.test(logLine))) {
      console.log(`[BotHealth] Bot error/crash detected`);

      await this.transitionState(deploymentId, "offline", {
        isActive: false,
        lastActiveAt: new Date(),
        errorMessage: logLine.substring(0, 500),
      });

      this.emit("bot.offline", { deploymentId });
      return;
    }

    // Update last activity for any log
    if (deployment.isActive) {
      await Deployment.findByIdAndUpdate(deploymentId, {
        lastActiveAt: new Date(),
      });
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
      if (["connected", "active", "paired"].includes(newStatus)) {
        updateFields["resources.state"] = "running";
      } else if (newStatus === "starting") {
        updateFields["resources.state"] = "starting";
      } else if (["stopped", "offline", "failed"].includes(newStatus)) {
        updateFields["resources.state"] = "offline";
      }

      // Calculate uptime if bot is active
      if (newStatus === "active" || newStatus === "connected") {
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

      // Prepare update fields
      const updateFields = {
        "resources.state": serverState,
        "resources.usedRam": resources.attributes.resources.memory_bytes,
        "resources.usedCpu": resources.attributes.resources.cpu_absolute,
        "resources.usedDisk": resources.attributes.resources.disk_bytes,
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
        deployment.resources.uptimeMs > uptimeMilliseconds + 60000
      ) {
        console.log(
          `[BotHealth] Detected restart for ${deployment.botName} (Uptime reset)`
        );
        updateFields["uptimeStart"] = new Date();
        updateFields["connectedAt"] = new Date(); // Reset connection time too
      }

      // Update resource usage
      await Deployment.findByIdAndUpdate(deploymentId, updateFields);

      // Check if server is offline
      if (serverState === "offline" || serverState === "stopping") {
        if (
          deployment.status !== "stopped" &&
          deployment.status !== "offline"
        ) {
          await this.transitionState(deploymentId, "offline", {
            isActive: false,
            lastActiveAt: new Date(),
          });
        }
      }

      // Check for stale activity
      const monitor = this.activeMonitors.get(deploymentId.toString());
      if (monitor) {
        const timeSinceLog = Date.now() - monitor.lastLogActivity;
        if (
          timeSinceLog > this.logActivityThreshold &&
          deployment.isActive &&
          serverState === "running"
        ) {
          // Bot might be frozen
          console.log(
            `[BotHealth] No log activity for ${timeSinceLog}ms, marking as potentially offline`
          );
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
    const fs = require("fs");
    const path = require("path");
    const logDir = path.join(__dirname, "../../logs");
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(
      path.join(logDir, "bot-health.log"),
      `[${new Date().toISOString()}] ${identifier}: ${logLine}\n`
    );
  }

  // Get all active bots
  async getActiveBots() {
    return await Deployment.find({
      isActive: true,
      status: { $in: ["active", "connected"] },
    }).populate("user", "username email");
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
      await this.detectAlreadyRunningBots();
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
                      /message received|command executed|processing message|handling command/i.test(
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
}

// Singleton instance
const botHealthService = new BotHealthService();

module.exports = botHealthService;
