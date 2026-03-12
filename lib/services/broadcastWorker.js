const BroadcastRecipient = require("../../models/BroadcastRecipient");
const EmailBroadcast = require("../../models/EmailBroadcast");
const emailBroadcastService = require("./emailBroadcastService");

/**
 * Broadcast Worker
 * Continuously processes pending email recipients in batches
 * Features: Auto-retry (max 3), batch processing, real-time stats update
 */

let isRunning = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const startWorker = async () => {
  if (isRunning) return;
  isRunning = true;
  console.log("[BroadcastWorker] Background worker started.");

  // Reusable transporter
  const transporter = emailBroadcastService.createTransporter();

  while (isRunning) {
    try {
      // 1. Fetch a batch of recipients that are either pending or failed but haven't hit max retries
      const BATCH_SIZE = 25;
      
      const recipients = await BroadcastRecipient.find({
        status: { $in: ["pending", "failed"] },
        attempts: { $lt: 3 } // Max 3 attempts
      })
      .limit(BATCH_SIZE)
      .sort({ attempts: 1, createdAt: 1 }) // Prioritize first-time attempts
      .lean();

      if (recipients.length === 0) {
        // No work to do, wait a bit
        await sleep(5000); 
        continue;
      }

      console.log(`[BroadcastWorker] Processing batch of ${recipients.length} recipients...`);

      // 2. Mark as processing
      const recipientIds = recipients.map(r => r._id);
      await BroadcastRecipient.updateMany(
        { _id: { $in: recipientIds } },
        { status: "processing" }
      );

      // Cache broadcast data to avoid many DB calls for the same broadcast in a batch
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
               attachments: [...inlineImages]
             }
           };

           // Mark broadcast as processing if not already
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
            lastError: "Broadcast data missing",
            $inc: { attempts: 1 }
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
          // Success: Update recipient
          await BroadcastRecipient.findByIdAndUpdate(recipient._id, {
            status: "sent",
            sentAt: new Date(),
            $inc: { attempts: 1 }
          });
          
          // Increment broadcast stats and add to list if not already there
          await EmailBroadcast.findByIdAndUpdate(recipient.broadcast, {
            $addToSet: { sentEmails: recipient.email },
            $inc: { "stats.sent": 1 }
          });
        } else {
          // Failure: Update recipient and check for retries
          const newAttempts = recipient.attempts + 1;
          const status = newAttempts >= 3 ? "failed" : "pending"; // Re-queue if attempts < 3

          await BroadcastRecipient.findByIdAndUpdate(recipient._id, {
            status,
            lastError: result.error,
            $inc: { attempts: 1 }
          });

          // If final failure, update broadcast stats
          if (status === "failed") {
            await EmailBroadcast.findByIdAndUpdate(recipient.broadcast, {
              $push: { failedEmails: { email: recipient.email, error: result.error } },
              $inc: { "stats.failed": 1 }
            });
          }
        }
      }

      // 4. Update broadcast status to 'completed' if all recipients are done
      for (const bId of broadcastIds) {
        const remaining = await BroadcastRecipient.countDocuments({
          broadcast: bId,
          status: { $in: ["pending", "processing"] }
        });

        if (remaining === 0) {
          const broadcast = await EmailBroadcast.findById(bId);
          if (broadcast && broadcast.status === "processing") {
            broadcast.status = "completed";
            broadcast.completedAt = new Date();
            await broadcast.save();
            console.log(`[BroadcastWorker] Broadcast ${bId} fully completed.`);
          }
        }
      }

      // Respect rate limit delay
      await sleep(1000);

    } catch (error) {
      console.error("[BroadcastWorker] Error in loop:", error);
      await sleep(10000);
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
