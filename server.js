const express = require("express");
const next = require("next");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, ".env") });

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Database connection
const connectDB = require("./lib/db");

// Services
const initScheduler = require("./lib/utils/scheduler");
const botHealthService = require("./lib/services/botHealthService");

app.prepare().then(async () => {
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

  console.log("[Server] Connecting to MongoDB...");
  await connectDB();
  console.log("[Server] MongoDB connected.");

  // Initialize Scheduler
  initScheduler();

  // Middleware
  server.use(express.json());

  // Socket.IO Event Handlers
  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on("join", (room) => {
      console.log(`[Socket.IO] Client ${socket.id} joining room: ${room}`);
      socket.join(room);
    });

    socket.on("terminal:command", async (data) => {
      const { deploymentId, command } = data;
      console.log(
        `[Socket.IO] Terminal command for ${deploymentId}: ${command}`
      );
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

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
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

  // Bot initialization moved after server start

  // Let Next.js handle all other routes
  server.all("*", (req, res) => {
    // Attach io to request for API routes
    req.io = io;
    return handle(req, res);
  });

  console.log("[Server] Starting HTTP server...");
  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> Ready on http://127.0.0.1:${port}`);
    console.log(`> Environment: ${dev ? "development" : "production"}`);

    // Initialize Bot Health Monitoring in the background after server is live
    console.log("[Server] Initializing Bot Health Monitors (Background)...");
    botHealthService.initializeAllMonitors().catch((err) => {
      console.error("[BotHealth] background init error:", err);
    });
  });
});
