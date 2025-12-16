const mongoose = require("mongoose");

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // Return existing connection if already connected
  if (cached.conn) {
    return cached.conn;
  }

  // Validate MONGO_URI exists
  if (!process.env.MONGO_URI) {
    const error = new Error(
      "❌ MONGO_URI is not defined in environment variables. Please check your .env.local file."
    );
    console.error(error.message);
    throw error;
  }

  // Create new connection if no promise exists
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    };

    console.log("🔄 Connecting to MongoDB...");

    cached.promise = mongoose
      .connect(process.env.MONGO_URI, opts)
      .then((mongoose) => {
        console.log("✅ MongoDB connected successfully");
        console.log(`📍 Host: ${mongoose.connection.host}`);
        return mongoose;
      })
      .catch((error) => {
        console.error("❌ MongoDB Connection Error:", error.message);
        console.error("⚠️  Please check:");
        console.error("   1. Your internet connection");
        console.error("   2. MongoDB Atlas whitelist settings");
        console.error("   3. MONGO_URI in .env.local file");
        console.error("   4. MongoDB cluster is running");

        // Clear the promise so next request can retry
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

module.exports = dbConnect;
