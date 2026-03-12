const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const Deployment = require("../models/Deployment");
const creditService = require("../lib/services/creditService");

async function testBilling() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Create/Find a test user
    let user = await User.findOne({ email: "billing-test@example.com" });
    if (!user) {
      user = await User.create({
        fullName: "Billing Test",
        username: "billingtest" + Date.now(),
        email: "billing-test@example.com",
        whatsappNumber: "1234567890" + Math.floor(Math.random() * 100),
        password: "password123",
        credits: 100
      });
      console.log("Created test user with 100 credits");
    } else {
      user.credits = 100;
      await user.save();
      console.log("Reset test user to 100 credits");
    }

    // 2. Create a test bot due for renewal
    const bot = await Deployment.create({
      user: user._id,
      botName: "Billing Test Bot",
      botNumber: "1234567890",
      status: "awaiting_pairing", 
      billingStatus: "active",
      nextRenewalAt: new Date(Date.now() - 3600000), 
      dailyBurn: 5
    });
    console.log(`Created test bot: ${bot.botName} (status: ${bot.status}, nextRenewalAt: ${bot.nextRenewalAt})`);

    // 3. Trigger Daily Burn - First time
    console.log("Triggering processDailyBurn (First time)...");
    await creditService.processDailyBurn();

    // 4. Verify results
    let updatedUser = await User.findById(user._id);
    let updatedBot = await Deployment.findById(bot._id);

    console.log(`User credits after: ${updatedUser.credits} (Expected: 95)`);
    console.log(`Bot status after: ${updatedBot.status} (Expected: awaiting_pairing)`);

    if (updatedUser.credits === 95 && updatedBot.nextRenewalAt > new Date()) {
      console.log("✅ First Billing SUCCESSFUL!");
    } else {
      console.log("❌ First Billing FAILED!");
    }

    // 5. Test Suspension (Insufficient credits)
    // Clear lastBurnDate to allow another burn in the same period for testing
    updatedBot.lastBurnDate = null;
    updatedBot.nextRenewalAt = new Date(Date.now() - 3600000); 
    await updatedBot.save();
    
    updatedUser.credits = 2;
    await updatedUser.save();
    
    console.log("Set user credits to 2 and reset bot for second burn");

    console.log("Triggering processDailyBurn (Second time)...");
    await creditService.processDailyBurn();

    const suspendedBot = await Deployment.findById(bot._id);
    console.log(`Bot status after low credits: ${suspendedBot.status} (Expected: suspended)`);

    if (suspendedBot.status === "suspended") {
      console.log("✅ Suspension SUCCESSFUL!");
    } else {
      console.log("❌ Suspension FAILED!");
    }

    // Cleanup
    await Deployment.deleteOne({ _id: bot._id });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testBilling();
