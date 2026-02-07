const nodemailer = require("nodemailer");
const User = require("../../models/User");
const EmailBroadcast = require("../../models/EmailBroadcast");

/**
 * Email Broadcast Service
 * Handles sending email broadcasts to all verified users with batching and failure handling
 */

// Configuration
const DEFAULT_BATCH_SIZE = 10; // Emails per batch
const DEFAULT_BATCH_DELAY = 1000; // 1 second between batches (rate limiting)
const MAX_BATCH_SIZE = 50;

/**
 * Create the nodemailer transporter
 * Reuses the same configuration as the existing email service
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
 * @param {Object} params - Email parameters
 * @param {string} params.subject - Email subject
 * @param {string} params.message - Email message body
 * @param {string} params.announcementType - Type of announcement
 * @param {string} params.priority - Priority level
 * @returns {string} HTML email content
 */
const generateBroadcastEmailHTML = ({
  subject,
  message,
  announcementType,
  priority,
  isHtml = false,
}) => {
  // Priority badge colors
  const priorityColors = {
    low: "#6B7280",
    normal: "#3B82F6",
    high: "#F59E0B",
    urgent: "#EF4444",
  };

  // Announcement type icons (emoji for simplicity)
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

  // Convert newlines to <br> for HTML if not utilizing rich text
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
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                    ${typeIcon} SAMKIEL BOT
                  </h1>
                </td>
              </tr>
              
              <!-- Priority Badge (if high or urgent) -->
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
              
              <!-- Subject -->
              <tr>
                <td style="padding: 25px 40px 10px;">
                  <h2 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">
                    ${subject}
                  </h2>
                </td>
              </tr>
              
              <!-- Message Body -->
              <tr>
                <td style="padding: 10px 40px 30px;">
                  <div style="color: #4b5563; font-size: 15px; line-height: 1.6;">
                    ${formattedMessage}
                  </div>
                </td>
              </tr>
              
              <!-- Divider -->
              <tr>
                <td style="padding: 0 40px;">
                  <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 0;">
                </td>
              </tr>
              
              <!-- Footer -->
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
 * Sleep utility for batch delays
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Send a single email to one recipient
 * @param {Object} transporter - Nodemailer transporter
 * @param {string} email - Recipient email
 * @param {Object} emailContent - Email content
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const sendSingleEmail = async (
  transporter,
  email,
  emailContent,
  recipientName = "",
) => {
  try {
    let finalHtml = emailContent.html;

    // Personalization: Replace @user with recipient's name or "User"
    if (recipientName) {
      finalHtml = finalHtml.replace(/@user/g, recipientName);
    } else {
      finalHtml = finalHtml.replace(/@user/g, "User");
    }

    await transporter.sendMail({
      from: `"${emailContent.senderName || "SAMKIEL BOT"}" <info@samkielbot.app>`,
      to: email,
      subject: emailContent.subject,
      html: finalHtml,
      attachments: emailContent.attachments, // Include attachments
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
 * Process a batch of emails
 * @param {Object} transporter - Nodemailer transporter
 * @param {string[]} emails - Array of email addresses
 * @param {Object} emailContent - Email content
 * @returns {Promise<{sent: number, failed: Array, successfulEmails: string[]}>}
 */
const processBatch = async (transporter, recipients, emailContent) => {
  const results = {
    sent: 0,
    failed: [],
    successfulEmails: [],
  };

  // Send emails in parallel within the batch
  const sendPromises = recipients.map(async (recipient) => {
    const email = recipient.email;
    const name = recipient.name || "";

    const result = await sendSingleEmail(
      transporter,
      email,
      emailContent,
      name,
    );

    if (result.success) {
      results.sent++;
      results.successfulEmails.push(email);
    } else {
      results.failed.push({
        email,
        error: result.error,
        timestamp: new Date(),
      });
    }
  });

  await Promise.all(sendPromises);
  return results;
};

/**
 * Send email broadcast to all verified users
 * @param {Object} params - Broadcast parameters
 * @param {string} [params.broadcastId] - Existing broadcast ID to resume
 * @param {string} params.senderId - ID of the admin sending the broadcast
 * @param {string} params.subject - Email subject
 * @param {string} params.message - Email message body
 * @param {string} params.announcementType - Type of announcement
 * @param {string} params.priority - Priority level
 * @param {number} [params.batchSize] - Emails per batch (default: 10)
 * @param {number} [params.batchDelay] - Delay between batches in ms (default: 1000)
 * @returns {Promise<Object>} Broadcast result
 */
const sendEmailBroadcast = async ({
  broadcastId,
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
  // Validate and cap batch size
  const effectiveBatchSize = Math.min(Math.max(1, batchSize), MAX_BATCH_SIZE);

  let broadcast;

  if (broadcastId) {
    broadcast = await EmailBroadcast.findById(broadcastId);
    if (!broadcast) throw new Error("Broadcast not found");
    if (broadcast.status === "completed")
      return { success: true, message: "Broadcast already completed" };

    broadcast.status = "processing";
    broadcast.startedAt = new Date();
    await broadcast.save();
  } else {
    // Create the broadcast record
    broadcast = await EmailBroadcast.create({
      sender: senderId,
      senderName: senderName || "Ezekiel",
      subject,
      message, // This is now HTML content
      attachments, // Store attachments metadata if needed (schema update required) or just use transiently
      announcementType,
      priority,
      status: "processing",
      batchSize: effectiveBatchSize,
      batchDelay,
      sentEmails: [],
      startedAt: new Date(),
    });
  }

  try {
    // Fetch all users with verified emails
    const users = await User.find({
      isEmailVerified: true,
      accountStatus: "active",
      email: { $exists: true, $ne: null },
    }).select("email fullName"); // Include fullName

    const alreadySentSet = new Set(broadcast.sentEmails || []);

    // Filter out emails already sent and prepare recipient objects
    const pendingRecipients = users
      .filter((u) => u.email && !alreadySentSet.has(u.email))
      .map((u) => {
        // Extract first name for @user personalization
        const firstName = u.fullName ? u.fullName.split(" ")[0] : "User";
        return {
          email: u.email,
          name: firstName,
        };
      });

    const totalRecipients = users.length;

    // Update stats with total recipients
    broadcast.stats.totalRecipients = totalRecipients;
    await broadcast.save();

    if (totalRecipients === 0) {
      broadcast.status = "completed";
      broadcast.completedAt = new Date();
      await broadcast.save();
      return {
        success: true,
        broadcastId: broadcast._id,
        stats: broadcast.stats,
        message: "No verified users found to send emails to",
      };
    }

    if (pendingRecipients.length === 0) {
      broadcast.status = "completed";
      broadcast.completedAt = new Date();
      await broadcast.save();
      return {
        success: true,
        broadcastId: broadcast._id,
        stats: broadcast.stats,
        message: "All users have already received this broadcast",
      };
    }

    // Create transporter
    const transporter = createTransporter();

    // Generate email HTML - Use rich HTML directly
    const emailContent = {
      senderName: broadcast.senderName, // Pass sender name
      subject: `SAMKIEL BOT: ${broadcast.subject}`,
      html: generateBroadcastEmailHTML({
        subject: broadcast.subject,
        message: broadcast.message, // HTML from editor
        announcementType: broadcast.announcementType,
        priority: broadcast.priority,
        isHtml: true, // Flag to prevent auto-replace ofnewlines
      }),
      attachments: attachments.map((att) => ({
        filename: att.filename,
        content: att.content, // Buffer or base64 string
        encoding: "base64", // Assume base64 coming from frontend
        contentType: att.contentType,
      })),
    };

    // Process in batches
    let totalSent = broadcast.sentEmails.length;
    let allFailed = [];

    console.log(
      `[EmailBroadcast] Resuming/Starting: ${pendingRecipients.length} emails pending out of ${totalRecipients}`,
    );

    for (let i = 0; i < pendingRecipients.length; i += effectiveBatchSize) {
      const batchRecipients = pendingRecipients.slice(
        i,
        i + effectiveBatchSize,
      );
      const batchNumber = Math.floor(i / effectiveBatchSize) + 1;
      const totalBatches = Math.ceil(
        pendingRecipients.length / effectiveBatchSize,
      );

      console.log(
        `[EmailBroadcast] Processing batch ${batchNumber}/${totalBatches} (${batchRecipients.length} emails)`,
      );

      // Process the batch
      const batchResult = await processBatch(
        transporter,
        batchRecipients,
        emailContent,
      );

      // Update broadcast state
      totalSent += batchResult.sent;
      allFailed = allFailed.concat(batchResult.failed);

      // Persist sent emails list to support resume
      if (
        batchResult.successfulEmails.length > 0 ||
        batchResult.failed.length > 0
      ) {
        await EmailBroadcast.findByIdAndUpdate(broadcast._id, {
          $push: {
            sentEmails: { $each: batchResult.successfulEmails },
            failedEmails: { $each: batchResult.failed },
          },
          $set: {
            "stats.sent": totalSent,
            "stats.failed":
              (broadcast.stats.failed || 0) + batchResult.failed.length,
          },
        });
      }

      // Update local broadcast object for next loop potentially or final status
      broadcast.stats.sent = totalSent;
      broadcast.stats.failed = (broadcast.stats.failed || 0) + allFailed.length;

      // Rate limiting delay between batches
      if (i + effectiveBatchSize < pendingRecipients.length) {
        await sleep(batchDelay);
      }
    }

    // Refresh final document to check status
    const finalBroadcast = await EmailBroadcast.findById(broadcast._id);

    // Finalize the broadcast record
    finalBroadcast.status =
      finalBroadcast.sentEmails.length >= totalRecipients
        ? "completed"
        : "partial";
    finalBroadcast.completedAt = new Date();
    await finalBroadcast.save();

    console.log(
      `[EmailBroadcast] Finished: ${finalBroadcast.stats.sent}/${totalRecipients} sent`,
    );

    return {
      success: true,
      broadcastId: finalBroadcast._id,
      stats: {
        totalRecipients,
        sent: finalBroadcast.stats.sent,
        failed: finalBroadcast.stats.failed,
        successRate: Math.round(
          (finalBroadcast.stats.sent / totalRecipients) * 100,
        ),
      },
      status: finalBroadcast.status,
    };
  } catch (error) {
    console.error("[EmailBroadcast] Critical error:", error);

    // Update broadcast with error status
    broadcast.status = "partial"; // Mark as partial if it fails mid-way
    broadcast.completedAt = new Date();
    broadcast.failedEmails.push({
      email: "SYSTEM",
      error: error.message,
      timestamp: new Date(),
    });
    await broadcast.save();

    throw error;
  }
};

/**
 * Get broadcast history with pagination
 * @param {Object} options - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @param {string} [options.status] - Filter by status
 * @returns {Promise<Object>} Paginated results
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
 * @param {string} broadcastId - Broadcast ID
 * @returns {Promise<Object|null>} Broadcast document
 */
const getBroadcastById = async (broadcastId) => {
  return EmailBroadcast.findById(broadcastId).populate(
    "sender",
    "username email fullName",
  );
};

/**
 * Send a test email
 * @param {Object} params - Test email parameters
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

  /* Attachments are already included in emailContent */
  const emailContent = {
    senderName,
    subject: `[TEST] ${subject}`, // Prefix with [TEST]
    html: generateBroadcastEmailHTML({
      subject,
      message,
      announcementType,
      priority,
      isHtml: true,
    }),
    attachments: attachments.map((att) => ({
      filename: att.filename,
      content: att.content,
      encoding: "base64",
      contentType: att.contentType,
    })),
  };

  // Pass "Test User" as the recipient name for personalization preview
  const result = await sendSingleEmail(
    transporter,
    to,
    emailContent,
    "Test User",
  );
  if (!result.success) {
    throw new Error(result.error);
  }

  return result;
};

module.exports = {
  sendEmailBroadcast,
  sendTestEmail,
  getBroadcastHistory,
  getBroadcastById,
  DEFAULT_BATCH_SIZE,
  DEFAULT_BATCH_DELAY,
};
