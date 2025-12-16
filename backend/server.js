const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

// ✅ Detect environment properly and load env first
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const next = require("next");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const deployRoutes = require("./routes/deploy");
const updateRoutes = require("./routes/update");
const adminRoutes = require("./routes/admin");
const interactionRoutes = require("./routes/interactions");
const creditsRoutes = require("./routes/credits");
const paymentRoutes = require("./routes/payments");
const initScheduler = require("./utils/scheduler");
const botHealthService = require("./services/botHealthService");

// Init Scheduler
initScheduler();

const { errorHandler } = require("./utils/errorHandler");

// ✅ Detect environment properly
const dev = process.env.NODE_ENV !== "production";
const app = express();
const server = http.createServer(app);

// ✅ Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Make io accessible to routes
app.set("io", io);

// ✅ Connect to MongoDB
connectDB();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/deploy", deployRoutes);
app.use("/api/update", updateRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/credits", creditsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api", interactionRoutes);

// ✅ Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// ✅ Socket.IO Event Handlers
io.on("connection", (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// ✅ Bot Health Service Event Forwarding
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

// ✅ Initialize Bot Health Monitoring
botHealthService.initializeAllMonitors().then(() => {
  console.log("[BotHealth] All monitors initialized");
});

// ✅ Serve frontend only in production
if (!dev) {
  const nextApp = next({
    dev: false,
    dir: path.join(__dirname, "../frontend"),
  });
  const handle = nextApp.getRequestHandler();

  nextApp.prepare().then(() => {
    app.get("*", (req, res) => handle(req, res));
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
} else {
  // ✅ Development mode — backend only
  server.listen(PORT, () =>
    console.log(`Backend API running on http://localhost:${PORT}`)
  );
}
