const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const User = require("../../models/User");
const EmailBroadcast = require("../../models/EmailBroadcast");
const BroadcastRecipient = require("../../models/BroadcastRecipient");

/**
 * Email Broadcast Service
 * Handles queuing email broadcasts to all verified users
 */

// Configuration
const DEFAULT_BATCH_SIZE = 25; // Optimized for queue processing
const DEFAULT_BATCH_DELAY = 1000; 
const MAX_BATCH_SIZE = 50;

/**
 * Create the nodemailer transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Generate HTML email template for broadcasts
 */
const generateBroadcastEmailHTML = ({
  subject,
  message,
  announcementType,
  priority,
  isHtml = false,
}) => {
  const priorityColors = {
    low: "#6B7280",
    normal: "#3B82F6",
    high: "#F59E0B",
    urgent: "#EF4444",
  };

  const typeIcons = {
    general: "📢",
    update: "🔄",
    maintenance: "🔧",
    security: "🔒",
    feature: "✨",
    policy: "📋",
    important: "⚠️",
  };

  const priorityColor = priorityColors[priority] || priorityColors.normal;
  const typeIcon = typeIcons[announcementType] || typeIcons.general;
  const formattedMessage = isHtml ? message : message.replace(/\n/g, "<br>");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                    ${typeIcon} SAMKIEL BOT
                  </h1>
                </td>
              </tr>
              ${
                priority === "high" || priority === "urgent"
                  ? `
              <tr>
                <td style="padding: 15px 40px 0;">
                  <span style="display: inline-block; background-color: ${priorityColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                    ${priority === "urgent" ? "🚨 URGENT" : "⚡ HIGH PRIORITY"}
                  </span>
                </td>
              </tr>
              `
                  : ""
              }
              <tr>
                <td style="padding: 25px 40px 10px;">
                  <h2 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">
                    ${subject}
                  </h2>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 40px 30px;">
                  <div style="color: #4b5563; font-size: 15px; line-height: 1.6;">
                    ${formattedMessage}
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px;">
                  <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 0;">
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px 30px; text-align: center;">
                  <p style="margin: 0 0 10px; color: #9ca3af; font-size: 13px;">
                    This is an official announcement from SAMKIEL BOT.
                  </p>
                  <p style="margin: 0 0 10px;">
                    <a href="https://samkielbot.app" style="color: #6366f1; text-decoration: none; font-size: 13px;">Visit our website →</a>
                    <span style="color: #d1d5db; margin: 0 8px;">|</span>
                    <a href="https://samkielbot.app/support" style="color: #6366f1; text-decoration: none; font-size: 13px;">Get Help</a>
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} SAMKIEL BOT. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Process HTML content to extract inline base64 images
 */
const processInlineImages = (html) => {
  const attachments = [];
  const processedHtml = html.replace(
    /<img[^>]+src="data:image\/([^;]+);base64,([^"]+)"[^>]*>/g,
    (match, type, content) => {
      const cid = `img-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}@samkielbot.app`;

      attachments.push({
        filename: `image-${attachments.length}.${type}`,
        content: content,
        encoding: "base64",
        cid: cid,
      });
      return match.replace(
        /src="data:image\/[^;]+;base64,[^"]+"/g,
        `src="cid:${cid}"`,
      );
    },
  );

  return { html: processedHtml, attachments };
};

/**
 * Send a single email (used by worker)
 */
const sendSingleEmail = async (
  transporter,
  email,
  emailContent,
  recipientName = "",
) => {
  try {
    let finalHtml = emailContent.html;
    let finalSubject = emailContent.subject;
    const displayName = recipientName || "User";

    // Replace @user placeholder in both body and subject (case-insensitive)
    finalHtml = finalHtml.replace(/@user/gi, displayName);
    finalSubject = finalSubject.replace(/@user/gi, displayName);

    await transporter.sendMail({
      from: {
        name: emailContent.senderName || "SAMKIEL BOT",
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      },
      to: email,
      subject: finalSubject,
      html: finalHtml,
      attachments: emailContent.attachments,
    });
    return { success: true };
  } catch (error) {
    console.error(
      `[EmailBroadcast] Failed to send to ${email}:`,
      error.message,
    );
    return { success: false, error: error.message };
  }
};

/**
 * Queue email broadcast and recipients
 */
const sendEmailBroadcast = async ({
  senderId,
  senderName,
  subject,
  message,
  attachments = [],
  announcementType = "general",
  priority = "normal",
  batchSize = DEFAULT_BATCH_SIZE,
  batchDelay = DEFAULT_BATCH_DELAY,
}) => {
  const effectiveBatchSize = Math.min(Math.max(1, batchSize), MAX_BATCH_SIZE);

  // 1. Create the broadcast record as 'queued'
  const broadcast = await EmailBroadcast.create({
    sender: senderId,
    senderName: senderName || "Ezekiel",
    subject,
    message,
    announcementType,
    priority,
    status: "queued",
    batchSize: effectiveBatchSize,
    batchDelay,
    sentEmails: [],
    startedAt: new Date(),
  });

  try {
    // 2. Fetch all target users
    const users = await User.find({
      isEmailVerified: true,
      accountStatus: "active",
      email: { $exists: true, $ne: null },
    }).select("email fullName");

    if (users.length === 0) {
      broadcast.status = "completed";
      broadcast.completedAt = new Date();
      await broadcast.save();
      return {
        success: true,
        broadcastId: broadcast._id,
        message: "No verified users found",
      };
    }

    // 3. Insert recipients into queue
    const recipientRecords = users.map((u) => ({
      broadcast: broadcast._id,
      user: u._id,
      email: u.email,
      name: u.fullName ? u.fullName.split(" ")[0] : "User",
      status: "pending",
    }));

    await BroadcastRecipient.insertMany(recipientRecords);

    // 4. Update stats
    broadcast.stats.totalRecipients = users.length;
    await broadcast.save();

    console.log(`[EmailBroadcast] Queued ${users.length} recipients for broadcast ${broadcast._id}`);

    return {
      success: true,
      broadcastId: broadcast._id,
      stats: {
        totalRecipients: users.length,
      },
      status: "queued",
    };
  } catch (error) {
    console.error("[EmailBroadcast] Failed to queue broadcast:", error);
    broadcast.status = "failed";
    broadcast.completedAt = new Date();
    await broadcast.save();
    throw error;
  }
};

/**
 * Get broadcast history with pagination
 */
const getBroadcastHistory = async ({ page = 1, limit = 20, status } = {}) => {
  const query = {};
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [broadcasts, total] = await Promise.all([
    EmailBroadcast.find(query)
      .populate("sender", "username email fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    EmailBroadcast.countDocuments(query),
  ]);

  return {
    broadcasts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single broadcast by ID
 */
const getBroadcastById = async (broadcastId) => {
  return EmailBroadcast.findById(broadcastId).populate(
    "sender",
    "username email fullName",
  );
};

/**
 * Send a test email
 */
const sendTestEmail = async ({
  to,
  senderName,
  subject,
  message,
  attachments = [],
  announcementType,
  priority,
}) => {
  const transporter = createTransporter();
  const { html: processedMessage, attachments: inlineImages } = processInlineImages(message);

  const emailContent = {
    senderName,
    subject: `[TEST] ${subject}`,
    html: generateBroadcastEmailHTML({
      subject,
      message: processedMessage,
      announcementType,
      priority,
      isHtml: true,
    }),
    attachments: [
      ...attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
        encoding: "base64",
        contentType: att.contentType || "application/octet-stream",
      })),
      ...inlineImages,
    ],
  };

  // Try to find the user in DB to make the test @user tag look real
  const User = require("../../models/User");
  const testUser = await User.findOne({ email: to.toLowerCase() });
  const recipientName = testUser 
    ? (testUser.fullName ? testUser.fullName.split(" ")[0] : "Admin")
    : "Admin";

  const result = await sendSingleEmail(transporter, to, emailContent, recipientName);
  if (!result.success) throw new Error(result.error);
  return result;
};

/**
 * Get detailed stats for a broadcast
 */
const getBroadcastStats = async (broadcastId) => {
  const [counts, broadcast] = await Promise.all([
    BroadcastRecipient.aggregate([
      { $match: { broadcast: new mongoose.Types.ObjectId(broadcastId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    EmailBroadcast.findById(broadcastId)
  ]);

  if (!broadcast) throw new Error("Broadcast not found");

  const stats = {
    total: broadcast.stats.totalRecipients || 0,
    sent: 0,
    pending: 0,
    failed: 0,
    processing: 0
  };

  counts.forEach(c => {
    if (stats.hasOwnProperty(c._id)) {
      stats[c._id] = c.count;
    }
  });

  return stats;
};

/**
 * Get recipients for a broadcast with pagination and filters
 */
const getBroadcastRecipients = async (broadcastId, { page = 1, limit = 50, status, search } = {}) => {
  const query = { broadcast: broadcastId };
  if (status && status !== "all") query.status = status;
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } }
    ];
  }

  const skip = (page - 1) * limit;

  const [recipients, total] = await Promise.all([
    BroadcastRecipient.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BroadcastRecipient.countDocuments(query)
  ]);

  return {
    recipients,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Perform manual action on a recipient (Retry or Send Now)
 */
const manualRecipientAction = async (recipientId) => {
  const recipient = await BroadcastRecipient.findById(recipientId);
  if (!recipient) throw new Error("Recipient not found");

  // Reset status to pending so worker picks it up immediately/next loop
  recipient.status = "pending";
  recipient.lastError = undefined;
  // If user clicks "Retry", we give them 3 more fresh attempts
  recipient.attempts = 0; 
  
  await recipient.save();

  // Also ensure broadcast status is 'processing' if it was 'completed' or 'failed'
  await EmailBroadcast.findByIdAndUpdate(recipient.broadcast, {
    status: "processing"
  });

  return { success: true, message: "Recipient queued for immediate retry" };
};

/**
 * Resume a broadcast by resetting failed/processing recipients
 */
const resumeBroadcast = async (broadcastId) => {
  const broadcast = await EmailBroadcast.findById(broadcastId);
  if (!broadcast) throw new Error("Broadcast not found");

  // Reset any processing or failed recipients that haven't hit max retries yet
  // or reset them all to pending if the admin wants to retry all failures
  const result = await BroadcastRecipient.updateMany(
    { 
      broadcast: broadcastId, 
      status: { $in: ["processing", "failed"] } 
    },
    { 
      status: "pending",
      $set: { attempts: 0 } // Reset attempts so worker tries again
    }
  );

  broadcast.status = "processing";
  await broadcast.save();

  return { 
    success: true, 
    recoveredCount: result.modifiedCount,
    message: `Resumed broadcast. ${result.modifiedCount} recipients queued for retry.`
  };
};

module.exports = {
  sendEmailBroadcast,
  sendTestEmail,
  getBroadcastHistory,
  getBroadcastById,
  createTransporter,
  processInlineImages,
  generateBroadcastEmailHTML,
  sendSingleEmail,
  getBroadcastStats,
  getBroadcastRecipients,
  manualRecipientAction,
  resumeBroadcast,
  DEFAULT_BATCH_SIZE,
  DEFAULT_BATCH_DELAY,
};
