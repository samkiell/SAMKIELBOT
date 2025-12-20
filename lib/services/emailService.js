const nodemailer = require("nodemailer");

/**
 * Send an OTP email to the user
 * @param {string} email - Destination email
 * @param {string} otp - The 6-digit OTP code (plain text for the email)
 * @returns {Promise<void>}
 */
const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: "SAMKIEL BOT",
      to: email,
      subject: "Verification Code for SAMKIEL BOT",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Verification Code</h2>
          <p style="font-size: 16px; color: #555;">Hello,</p>
          <p style="font-size: 16px; color: #555;">Your verification code for SAMKIEL BOT is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background: #f4f4f4; padding: 10px 20px; border-radius: 5px; color: #007bff;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #888;">This code will expire in 10 minutes. Please do not share this code with anyone.</p>
          <p style="font-size: 14px; color: #888;">If you did not request this code, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #aaa; text-align: center;">&copy; ${new Date().getFullYear()} SAMKIEL BOT. All rights reserved.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EmailService] OTP sent to ${email}`);
  } catch (error) {
    console.error("[EmailService] Error sending email:", error);
    throw new Error("Failed to send OTP email");
  }
};

module.exports = {
  sendOTPEmail,
};
