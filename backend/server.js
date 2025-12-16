const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// ✅ Detect environment properly and load env first
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const next = require("next");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const deployRoutes = require("./routes/deploy");
const updateRoutes = require("./routes/update");
const adminRoutes = require("./routes/admin");
const { errorHandler } = require("./utils/errorHandler");

// ✅ Detect environment properly
const dev = process.env.NODE_ENV !== "production";
const app = express();

// ✅ Connect to MongoDB
connectDB();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/deploy", deployRoutes);
app.use("/api/update", updateRoutes);
app.use("/api/admin", adminRoutes); // New

// ✅ Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// ✅ Serve frontend only in production
if (!dev) {
  const nextApp = next({
    dev: false,
    dir: path.join(__dirname, "../frontend"),
  });
  const handle = nextApp.getRequestHandler();

  nextApp.prepare().then(() => {
    app.get("*", (req, res) => handle(req, res));
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
} else {
  // ✅ Development mode — backend only
  app.listen(PORT, () =>
    console.log(`Backend API running on http://localhost:${PORT}`)
  );
}
