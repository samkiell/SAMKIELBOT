const WebSocket = require("ws");
const Deployment = require("../models/Deployment");
const Notification = require("../models/Notification");
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
        ws.send(JSON.stringify({ event: "auth", args: [token] }));
      });

      ws.on("message", (data) => {
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
    const pairingRegex = /Your Pairing Code\s*:\s*([A-Z0-9]{4}-[A-Z0-9]{4})/i;
    const pairingMatch = logLine.match(pairingRegex);

    if (pairingMatch && pairingMatch[1]) {
      const code = pairingMatch[1];
      console.log(`[BotHealth] Pairing code detected: ${code}`);

      await this.transitionState(deploymentId, "awaiting_pairing", {
        pairingCode: code,
      });

      this.emit("bot.pairing_code", { deploymentId, code });
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

      // Prepare update fields
      const updateFields = {
        "resources.state": serverState,
        "resources.usedRam": resources.attributes.resources.memory_bytes,
        "resources.usedCpu": resources.attributes.resources.cpu_absolute,
        "resources.usedDisk": resources.attributes.resources.disk_bytes,
      };

      // Update uptime for active bots
      if (deployment.isActive && deployment.uptimeStart) {
        const uptimeMs =
          Date.now() - new Date(deployment.uptimeStart).getTime();
        const uptimeMinutes = Math.floor(uptimeMs / 60000);
        updateFields["usageStats.uptimeMinutes"] = uptimeMinutes;
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
      console.error(`[BotHealth] Health check error:`, error.message);
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
    } catch (error) {
      console.error(`[BotHealth] Init error:`, error.message);
    }
  }
}

// Singleton instance
const botHealthService = new BotHealthService();

module.exports = botHealthService;
