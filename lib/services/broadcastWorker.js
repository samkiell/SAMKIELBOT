const BroadcastRecipient = require("../../models/BroadcastRecipient");
const EmailBroadcast = require("../../models/EmailBroadcast");
const emailBroadcastService = require("./emailBroadcastService");

/**
 * Broadcast Worker
 * Processes pending email recipients in batches
 * Features: Auto-retry (max 3), batch processing, real-time stats update
 */

let isRunning = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Processes a single batch of pending recipients
 * Optimized for serverless environments (e.g., Vercel Cron)
 * @returns {Object} result containing processed count and if more work is pending
 */
const processNextBatch = async (batchSize = 25) => {
  try {
    // 1. Fetch a batch of recipients that are either pending or failed but haven't hit max retries
    const recipients = await BroadcastRecipient.find({
      status: { $in: ["pending", "failed"] },
      attempts: { $lt: 3 } // Max 3 attempts
    })
    .limit(batchSize)
    .sort({ attempts: 1, createdAt: 1 }) // Prioritize first-time attempts
    .lean();

    if (recipients.length === 0) {
      return { processed: 0, hasMore: false };
    }

    console.log(`[BroadcastWorker] Processing batch of ${recipients.length} recipients...`);

    // 2. Mark as processing
    const recipientIds = recipients.map(r => r._id);
    await BroadcastRecipient.updateMany(
      { _id: { $in: recipientIds } },
      { status: "processing" }
    );

    // Reusable transporter
    const transporter = emailBroadcastService.createTransporter();

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
        await BroadcastRecipient.findByIdAndUpdate(recipient._id, {
          status: "sent",
          sentAt: new Date(),
          $inc: { attempts: 1 }
        });
        
        await EmailBroadcast.findByIdAndUpdate(recipient.broadcast, {
          $addToSet: { sentEmails: recipient.email },
          $inc: { "stats.sent": 1 }
        });
      } else {
        const newAttempts = recipient.attempts + 1;
        const status = newAttempts >= 3 ? "failed" : "pending";

        await BroadcastRecipient.findByIdAndUpdate(recipient._id, {
          status,
          lastError: result.error,
          $inc: { attempts: 1 }
        });

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

    // Check if there are still more pending recipients
    const moreWork = await BroadcastRecipient.exists({
      status: { $in: ["pending", "failed"] },
      attempts: { $lt: 3 }
    });

    return { processed: recipients.length, hasMore: !!moreWork };
  } catch (error) {
    console.error("[BroadcastWorker] processNextBatch error:", error);
    throw error;
  }
};

const startWorker = async () => {
  if (isRunning) return;
  isRunning = true;
  console.log("[BroadcastWorker] Background worker started.");

  // Recovery: Reset any 'processing' recipients back to 'pending' on startup
  try {
    const recovered = await BroadcastRecipient.updateMany(
      { status: "processing" },
      { status: "pending" }
    );
    if (recovered.modifiedCount > 0) {
      console.log(`[BroadcastWorker] Recovered ${recovered.modifiedCount} stuck recipients.`);
    }
  } catch (err) {
    console.error("[BroadcastWorker] Recovery error:", err);
  }

  while (isRunning) {
    try {
      const { processed, hasMore } = await processNextBatch(25);
      
      if (!hasMore) {
        await sleep(10000); // No work, wait longer
      } else {
        await sleep(2000); // Respect rate limits between batches
      }
    } catch (error) {
      console.error("[BroadcastWorker] Error in loop:", error);
      await sleep(15000);
    }
  }
};

const stopWorker = () => {
  isRunning = false;
};

module.exports = {
  startWorker,
  stopWorker,
  processNextBatch
};

