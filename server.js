const express = require("express");
const next = require("next");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

const dev = process.env.NODE_ENV !== "production";
// No explicit hostname to allow defaults

// Parse command line arguments for port
const args = process.argv.slice(2);
const portIndex =
  args.indexOf("-p") !== -1 ? args.indexOf("-p") : args.indexOf("--port");
const port = parseInt(
  (portIndex !== -1 && args[portIndex + 1]) || process.env.PORT || "3000",
  10
);

// Initialize Next.js
const app = next({ dev });
const handle = app.getRequestHandler();

// Database connection
const connectDB = require("./lib/db");
const { protect, admin } = require("./lib/utils/authMiddleware");
const { successResponse } = require("./lib/utils/response");

// Services
const initScheduler = require("./lib/utils/scheduler");
const botHealthService = require("./lib/services/botHealthService");
const infraOrchestrator = require("./lib/services/infraOrchestrator");

app
  .prepare()
  .then(async () => {
    const server = express();
    const httpServer = http.createServer(server);

    // Socket.IO Setup
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_API_URL || `http://localhost:${port}`,
        methods: ["GET", "POST"],
      },
    });

    // Make io accessible to API routes
    server.set("io", io);

    await connectDB();

    // Initialize Scheduler
    initScheduler();

    // Middleware
    server.use(express.json());

    // Security Headers
    server.use((req, res, next) => {
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://*.vercel-insights.com; style-src 'self' 'unsafe-inline'; img-src 'self' https://res.cloudinary.com data:; font-src 'self' data:; connect-src 'self' https://*.vercel-insights.com https://*.vercel-analytics.com https://apiskeith.vercel.app; frame-src 'self' https://challenges.cloudflare.com; frame-ancestors 'self';"
      );
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload"
      );
      next();
    });

    // Socket.IO Event Handlers
    io.on("connection", (socket) => {
      socket.on("join", (room) => {
        socket.join(room);
      });

      socket.on("terminal:command", async (data) => {
        const { deploymentId, command } = data;
        if (deploymentId && command) {
          try {
            await botHealthService.sendCommandToBot(deploymentId, command);
          } catch (error) {
            console.error(
              `[Socket.IO] Failed to send terminal command:`,
              error.message
            );
            socket.emit("terminal:error", {
              message: "Failed to send command to bot.",
            });
          }
        }
      });

      socket.on("disconnect", () => {});
    });

    // Bot Health Service Event Forwarding
    botHealthService.on("bot.status_change", (data) => {
      if (data.deploymentId) {
        io.to(data.deploymentId.toString()).emit("bot:status_change", data);
      }
      io.emit("bot:status_change", data); // Keep global for dashboard?
    });

    botHealthService.on("bot.pairing_code", (data) => {
      if (data.deploymentId) {
        io.to(data.deploymentId.toString()).emit("bot:pairing_code", data);
      }
    });

    botHealthService.on("bot.paired", (data) => {
      if (data.deploymentId) {
        io.to(data.deploymentId.toString()).emit("bot:paired", data);
      }
    });

    botHealthService.on("bot.connected", (data) => {
      if (data.deploymentId) {
        io.to(data.deploymentId.toString()).emit("bot:connected", data);
      }
    });

    botHealthService.on("bot.active", (data) => {
      if (data.deploymentId) {
        io.to(data.deploymentId.toString()).emit("bot:active", data);
      }
    });

    botHealthService.on("bot.offline", (data) => {
      if (data.deploymentId) {
        io.to(data.deploymentId.toString()).emit("bot:offline", data);
      }
    });

    botHealthService.on("bot.log", (data) => {
      io.to(data.deploymentId).emit("bot:log", data);
    });

    botHealthService.on("bot.stats", (data) => {
      if (data.deploymentId) {
        io.to(data.deploymentId.toString()).emit("bot:stats", data);
      }
    });

    infraOrchestrator.on("infra.update", (data) => {
      io.emit("infra:update", data);
    });

    // Bot initialization moved after server start

    const adminController = require("./lib/controllers/adminController");

    server.get("/api/admin/infrastructure/overview", async (req, res) => {
      return await protect(req, res, async () => {
        return await admin(req, res, async () => {
          return await adminController.getInfraOverview(req, res);
        });
      });
    });

    server.post("/api/admin/infrastructure/refresh", async (req, res) => {
      return await protect(req, res, async () => {
        return await admin(req, res, async () => {
          return await adminController.refreshInfraOverview(req, res);
        });
      });
    });

    // Let Next.js handle all other routes
    server.all("*", (req, res) => {
      // Attach io to request for API routes
      req.io = io;
      return handle(req, res);
    });

    // Starting server
    httpServer.listen(port, "0.0.0.0", (err) => {
      if (err) throw err;
      console.log(`- ready on http://localhost:${port}`);

      // Initialize Bot Health Monitoring and Infra Orchestrator in the background after server is live
      setTimeout(() => {
        botHealthService.initializeAllMonitors().catch((err) => {
          console.error("[BotHealth] background init error:", err);
        });

        infraOrchestrator.start().catch((err) => {
          console.error("[InfraOrchestrator] background init error:", err);
        });
      }, 2000);
    });
  })
  .catch((err) => {
    console.error("[Server] Next.js initialization failed:", err);
    process.exit(1);
  });
