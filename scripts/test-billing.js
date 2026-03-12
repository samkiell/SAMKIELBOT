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
      status: "awaiting_pairing", // One of the newly added statuses
      billingStatus: "active",
      nextRenewalAt: new Date(Date.now() - 3600000), // 1 hour ago (due)
      dailyBurn: 5
    });
    console.log(`Created test bot: ${bot.botName} (status: ${bot.status}, nextRenewalAt: ${bot.nextRenewalAt})`);


    // Cleanup
    await Deployment.deleteOne({ _id: bot._id });
    // Keep user for future tests or delete: await User.deleteOne({ _id: user._id });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testBilling();
