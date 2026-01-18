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

  // Convert newlines to <br> for HTML
  const formattedMessage = message.replace(/\n/g, "<br>");

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
const sendSingleEmail = async (transporter, email, emailContent) => {
  try {
    await transporter.sendMail({
      from: `"SAMKIEL BOT" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
    return { success: true };
  } catch (error) {
    console.error(
      `[EmailBroadcast] Failed to send to ${email}:`,
      error.message
    );
    return { success: false, error: error.message };
  }
};

/**
 * Process a batch of emails
 * @param {Object} transporter - Nodemailer transporter
 * @param {string[]} emails - Array of email addresses
 * @param {Object} emailContent - Email content
 * @returns {Promise<{sent: number, failed: Array}>}
 */
const processBatch = async (transporter, emails, emailContent) => {
  const results = {
    sent: 0,
    failed: [],
  };

  // Send emails in parallel within the batch
  const sendPromises = emails.map(async (email) => {
    const result = await sendSingleEmail(transporter, email, emailContent);
    if (result.success) {
      results.sent++;
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
  senderId,
  subject,
  message,
  announcementType = "general",
  priority = "normal",
  batchSize = DEFAULT_BATCH_SIZE,
  batchDelay = DEFAULT_BATCH_DELAY,
}) => {
  // Validate and cap batch size
  const effectiveBatchSize = Math.min(Math.max(1, batchSize), MAX_BATCH_SIZE);

  // Create the broadcast record
  const broadcast = await EmailBroadcast.create({
    sender: senderId,
    subject,
    message,
    announcementType,
    priority,
    status: "processing",
    batchSize: effectiveBatchSize,
    batchDelay,
    startedAt: new Date(),
  });

  try {
    // Fetch all users with verified emails
    const users = await User.find({
      isEmailVerified: true,
      accountStatus: "active",
      email: { $exists: true, $ne: null },
    }).select("email");

    const emails = users.map((u) => u.email).filter(Boolean);
    const totalRecipients = emails.length;

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

    // Create transporter
    const transporter = createTransporter();

    // Generate email HTML
    const emailContent = {
      subject: `SAMKIEL BOT: ${subject}`,
      html: generateBroadcastEmailHTML({
        subject,
        message,
        announcementType,
        priority,
      }),
    };

    // Process in batches
    let totalSent = 0;
    let allFailed = [];

    for (let i = 0; i < emails.length; i += effectiveBatchSize) {
      const batchEmails = emails.slice(i, i + effectiveBatchSize);
      const batchNumber = Math.floor(i / effectiveBatchSize) + 1;
      const totalBatches = Math.ceil(emails.length / effectiveBatchSize);

      console.log(
        `[EmailBroadcast] Processing batch ${batchNumber}/${totalBatches} (${batchEmails.length} emails)`
      );

      // Process the batch
      const batchResult = await processBatch(
        transporter,
        batchEmails,
        emailContent
      );
      totalSent += batchResult.sent;
      allFailed = allFailed.concat(batchResult.failed);

      // Update progress in database
      broadcast.stats.sent = totalSent;
      broadcast.stats.failed = allFailed.length;
      await broadcast.save();

      // Rate limiting delay between batches (except for the last batch)
      if (i + effectiveBatchSize < emails.length) {
        await sleep(batchDelay);
      }
    }

    // Finalize the broadcast record
    broadcast.status =
      allFailed.length === 0
        ? "completed"
        : allFailed.length === totalRecipients
        ? "failed"
        : "partial";
    broadcast.failedEmails = allFailed.slice(0, 100); // Store up to 100 failed emails
    broadcast.completedAt = new Date();
    await broadcast.save();

    console.log(
      `[EmailBroadcast] Completed: ${totalSent}/${totalRecipients} sent, ${allFailed.length} failed`
    );

    return {
      success: true,
      broadcastId: broadcast._id,
      stats: {
        totalRecipients,
        sent: totalSent,
        failed: allFailed.length,
        successRate: Math.round((totalSent / totalRecipients) * 100),
      },
      status: broadcast.status,
    };
  } catch (error) {
    console.error("[EmailBroadcast] Critical error:", error);

    // Update broadcast with error status
    broadcast.status = "failed";
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
    "username email fullName"
  );
};

/**
 * Send a TEST email to a specific address (for preview before broadcast)
 * @param {Object} params - Test email parameters
 * @param {string} params.testEmail - Email address to send test to
 * @param {string} params.subject - Email subject
 * @param {string} params.message - Email message body
 * @param {string} params.announcementType - Type of announcement
 * @param {string} params.priority - Priority level
 * @returns {Promise<Object>} Test result
 */
const sendTestEmail = async ({
  testEmail,
  subject,
  message,
  announcementType = "general",
  priority = "normal",
}) => {
  try {
    // Create transporter
    const transporter = createTransporter();

    // Generate email HTML
    const emailContent = {
      subject: `[TEST] SAMKIEL BOT: ${subject}`,
      html: generateBroadcastEmailHTML({
        subject: `[TEST] ${subject}`,
        message,
        announcementType,
        priority,
      }),
    };

    // Send the test email
    const result = await sendSingleEmail(transporter, testEmail, emailContent);

    if (result.success) {
      console.log(`[EmailBroadcast] Test email sent to ${testEmail}`);
      return {
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        testEmail,
      };
    } else {
      return {
        success: false,
        message: `Failed to send test email: ${result.error}`,
        error: result.error,
      };
    }
  } catch (error) {
    console.error("[EmailBroadcast] Test email error:", error);
    return {
      success: false,
      message: error.message,
      error: error.message,
    };
  }
};

module.exports = {
  sendEmailBroadcast,
  sendTestEmail,
  getBroadcastHistory,
  getBroadcastById,
  DEFAULT_BATCH_SIZE,
  DEFAULT_BATCH_DELAY,
};
