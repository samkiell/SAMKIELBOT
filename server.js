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

  // Connect to MongoDB
  await connectDB();

  // Initialize Scheduler
  initScheduler();

  // Middleware
  server.use(express.json());

  // Socket.IO Event Handlers
  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  // Bot Health Service Event Forwarding
  botHealthService.on("bot.status_change", (data) => {
    io.emit("bot:status_change", data);
  });

  botHealthService.on("bot.pairing_code", (data) => {
    io.emit("bot:pairing_code", data);
  });

  botHealthService.on("bot.paired", (data) => {
    io.emit("bot:paired", data);
  });

  botHealthService.on("bot.connected", (data) => {
    io.emit("bot:connected", data);
  });

  botHealthService.on("bot.active", (data) => {
    io.emit("bot:active", data);
  });

  botHealthService.on("bot.offline", (data) => {
    io.emit("bot:offline", data);
  });

  // Initialize Bot Health Monitoring
  botHealthService.initializeAllMonitors().then(() => {
    console.log("[BotHealth] All monitors initialized");
  });

  // Let Next.js handle all other routes
  server.all("*", (req, res) => {
    // Attach io to request for API routes
    req.io = io;
    return handle(req, res);
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Environment: ${dev ? "development" : "production"}`);
  });
});
