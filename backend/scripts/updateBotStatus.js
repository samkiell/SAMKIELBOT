// Manual script to update bot status to active
// Run this with: node backend/scripts/updateBotStatus.js

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const Deployment = require("../models/Deployment");

const updateBotStatus = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find the bot by name
    const bot = await Deployment.findOne({ botName: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋" });

    if (!bot) {
      console.log("Bot not found!");
      process.exit(1);
    }

    console.log("Found bot:", bot.botName);
    console.log("Current status:", bot.status);
    console.log("Current isActive:", bot.isActive);

    // Update to active status
    bot.status = "active";
    bot.isActive = true;
    bot.connectedAt = new Date();
    bot.uptimeStart = new Date();
    bot.lastActiveAt = new Date();
    bot.resources.state = "running";

    await bot.save();

    console.log("\n✅ Bot updated successfully!");
    console.log("New status:", bot.status);
    console.log("New isActive:", bot.isActive);
    console.log("uptimeStart:", bot.uptimeStart);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

updateBotStatus();
