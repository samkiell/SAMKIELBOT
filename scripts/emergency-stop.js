/**
 * Emergency script to stop the accidental broadcast
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const EmailBroadcast = require('../models/EmailBroadcast');
const BroadcastRecipient = require('../models/BroadcastRecipient');

async function stopAll() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is missing");
    
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    // Find recent broadcasts created by "Verifier" (from the script) or just any recent ones
    const recentBroadcasts = await EmailBroadcast.find({ 
      senderName: "Verifier", 
      status: { $in: ["pending", "processing"] } 
    }).sort({ createdAt: -1 });

    if (recentBroadcasts.length === 0) {
      console.log("No active 'Verifier' broadcasts found.");
    } else {
      for (const b of recentBroadcasts) {
        console.log(`Stopping broadcast: ${b.subject} (${b._id})`);
        
        // 1. Mark broadcast as failed/stopped
        b.status = "failed";
        await b.save();
        
        // 2. Mark all recipients as failed so worker skips them
        const result = await BroadcastRecipient.updateMany(
          { broadcast: b._id, status: { $in: ["pending", "processing"] } },
          { $set: { status: "failed", lastError: "MANUAL EMERGENCY STOP TRIGGERED" } }
        );
        console.log(`- Stopped ${result.modifiedCount} recipients.`);
      }
    }

    console.log("\nEmergency stop complete.");
    process.exit(0);

  } catch (error) {
    console.error("Stop script failed:", error);
    process.exit(1);
  }
}

stopAll();
