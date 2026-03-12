const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

// Load env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const EmailBroadcast = require("../models/EmailBroadcast");
const BroadcastRecipient = require("../models/BroadcastRecipient");
const emailBroadcastService = require("../lib/services/emailBroadcastService");
const broadcastWorker = require("../lib/services/broadcastWorker");

async function test() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    // 1. Create a dummy verified user if none exists
    let user = await User.findOne({ isEmailVerified: true });
    if (!user) {
      console.log("Creating test user...");
      user = await User.create({
        username: "testuser",
        email: "test@example.com",
        fullName: "Test User",
        isEmailVerified: true,
        accountStatus: "active",
        password: "password123"
      });
    }

    console.log(`Using test user: ${user.email}`);

    // 2. Trigger broadcast
    console.log("Queueing broadcast...");
    const result = await emailBroadcastService.sendEmailBroadcast({
      senderId: user._id,
      senderName: "Tester",
      subject: "Test Broadcast Queue",
      message: "This is a test message to verify the queue system.",
      announcementType: "update",
      priority: "normal"
    });

    console.log("Broadcast queued:", result.broadcastId);

    // 3. Verify records
    const recipients = await BroadcastRecipient.find({ broadcast: result.broadcastId });
    console.log(`Found ${recipients.length} recipients in queue.`);

    if (recipients.length > 0) {
      console.log("First recipient status:", recipients[0].status);
    }

    // 4. Manually trigger worker loop once (stoppable)
    console.log("Starting worker briefly to process...");
    broadcastWorker.startWorker();
    
    // Wait for processing
    await new Promise(r => setTimeout(r, 5000));
    
    const processed = await BroadcastRecipient.find({ broadcast: result.broadcastId });
    console.log("Processing results:");
    processed.forEach(p => {
      console.log(`- ${p.email}: ${p.status} ${p.error ? `(Error: ${p.error})` : ""}`);
    });

    const finalBroadcast = await EmailBroadcast.findById(result.broadcastId);
    console.log("Final Broadcast Status:", finalBroadcast.status);

    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

test();
