const mongoose = require("mongoose");

const connectDB = async (retries = 5) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    console.log(`MongoDB don Connect\nHost: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    if (retries > 0) {
      console.log(`🔄 Retrying connection... (${retries} attempts remaining)`);
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds
      return connectDB(retries - 1);
    } else {
      console.error("❌ Failed to connect to MongoDB after multiple attempts.");
      console.error("⚠️  Please check:");
      console.error("   1. Your internet connection");
      console.error("   2. MongoDB Atlas whitelist settings");
      console.error("   3. MONGO_URI in .env file");
      console.error("   4. Try flushing DNS: ipconfig /flushdns");
      // Don't exit, let the app run without DB (will show errors but won't crash)
      // process.exit(1);
    }
  }
};

module.exports = connectDB;
