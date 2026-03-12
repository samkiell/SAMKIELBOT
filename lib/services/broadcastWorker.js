const BroadcastRecipient = require("../../models/BroadcastRecipient");
const EmailBroadcast = require("../../models/EmailBroadcast");
const emailBroadcastService = require("./emailBroadcastService");

/**
 * Broadcast Worker
 * Continuously processes pending email recipients in batches
 */

let isRunning = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const startWorker = async () => {
  if (isRunning) return;
  isRunning = true;
  console.log("[BroadcastWorker] Background worker started.");

  const transporter = emailBroadcastService.createTransporter();

  // Optimized to use while loop as requested
  while (isRunning) {
    try {
      // 1. Find a batch of pending recipients
      // We process batches of 25 to avoid overwhelming the system
      const BATCH_SIZE = emailBroadcastService.DEFAULT_BATCH_SIZE || 25;
      
      const recipients = await BroadcastRecipient.find({ status: "pending" })
        .limit(BATCH_SIZE)
        .lean();

      if (recipients.length === 0) {
        // No work to do, wait a bit before checking again
        await sleep(5000); 
        continue;
      }

      console.log(`[BroadcastWorker] Processing batch of ${recipients.length} recipients...`);

      // 2. Mark as sending
      const recipientIds = recipients.map(r => r._id);
      await BroadcastRecipient.updateMany(
        { _id: { $in: recipientIds } },
        { status: "sending" }
      );

      // Group by broadcast for efficiency in content generation
      const broadcastIds = [...new Set(recipients.map(r => r.broadcast.toString()))];
      const broadcastCache = {};

      for (const bId of broadcastIds) {
        const broadcast = await EmailBroadcast.findById(bId);
        if (broadcast) {
           const { html: processedMessage, attachments: inlineImages } = 
             emailBroadcastService.processInlineImages(broadcast.message);

           broadcastCache[bId] = {
             broadcast,
             emailContent: {
               senderName: broadcast.senderName,
               subject: `SAMKIEL BOT: ${broadcast.subject}`,
               html: emailBroadcastService.generateBroadcastEmailHTML({
                 subject: broadcast.subject,
                 message: processedMessage,
                 announcementType: broadcast.announcementType,
                 priority: broadcast.priority,
                 isHtml: true,
               }),
               attachments: [
                 // Attachments from broadcast model could be added here if needed
                 ...inlineImages,
               ]
             }
           };

           // Mark broadcast as processing if it was queued
           if (broadcast.status === "queued") {
             broadcast.status = "processing";
             await broadcast.save();
           }
        }
      }

      // 3. Process each recipient in the batch
      for (const recipient of recipients) {
        const cache = broadcastCache[recipient.broadcast.toString()];
        if (!cache) {
          await BroadcastRecipient.findByIdAndUpdate(recipient._id, { 
            status: "failed", 
            error: "Broadcast data missing" 
          });
          continue;
        }

        const result = await emailBroadcastService.sendSingleEmail(
          transporter,
          recipient.email,
          cache.emailContent,
          recipient.name
        );

        if (result.success) {
          await BroadcastRecipient.findByIdAndUpdate(recipient._id, {
            status: "sent",
            processedAt: new Date()
          });
          
          // Increment broadcast stats
          await EmailBroadcast.findByIdAndUpdate(recipient.broadcast, {
            $push: { sentEmails: recipient.email },
            $inc: { "stats.sent": 1 }
          });
        } else {
          await BroadcastRecipient.findByIdAndUpdate(recipient._id, {
            status: "failed",
            error: result.error,
            processedAt: new Date(),
            $inc: { retryCount: 1 }
          });

          await EmailBroadcast.findByIdAndUpdate(recipient.broadcast, {
            $push: { failedEmails: { email: recipient.email, error: result.error } },
            $inc: { "stats.failed": 1 }
          });
        }
      }

      // 4. Check if broadcasts are completed
      for (const bId of broadcastIds) {
        const remaining = await BroadcastRecipient.countDocuments({
          broadcast: bId,
          status: { $in: ["pending", "sending"] }
        });

        if (remaining === 0) {
          const broadcast = await EmailBroadcast.findById(bId);
          if (broadcast && broadcast.status === "processing") {
            broadcast.status = "completed";
            broadcast.completedAt = new Date();
            await broadcast.save();
            console.log(`[BroadcastWorker] Broadcast ${bId} completed.`);
          }
        }
      }

      // Rate limiting delay between batches
      await sleep(emailBroadcastService.DEFAULT_BATCH_DELAY || 2000);

    } catch (error) {
      console.error("[BroadcastWorker] Error in loop:", error);
      await sleep(10000); // Wait longer on error
    }
  }
};

const stopWorker = () => {
  isRunning = false;
};

module.exports = {
  startWorker,
  stopWorker
};
