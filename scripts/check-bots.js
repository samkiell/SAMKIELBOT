const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const Deployment = require("../models/Deployment");
const User = require("../models/User");

async function checkBots() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const bots = await Deployment.find({}).populate("user");
    console.log(`Found ${bots.length} total bots`);

    bots.forEach(bot => {
      console.log(`- Bot: ${bot.botName} (${bot._id})`);
      console.log(`  Status: ${bot.status}`);
      console.log(`  Billing Status: ${bot.billingStatus}`);
      console.log(`  Next Renewal At: ${bot.nextRenewalAt}`);
      console.log(`  User Credits: ${bot.user ? bot.user.credits : 'N/A'}`);
      console.log(`  Last Burn Date: ${bot.lastBurnDate}`);
      console.log("-------------------");
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkBots();
