const bcrypt = require("bcryptjs");
const crypto = require("crypto");

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash the OTP using bcrypt
 * @param {string} otp
 * @returns {Promise<string>} Hashed OTP
 */
const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(otp, salt);
};

/**
 * Verify OTP against its hash
 * @param {string} otp
 * @param {string} hashedOTP
 * @returns {Promise<boolean>}
 */
const verifyOTP = async (otp, hashedOTP) => {
  return await bcrypt.compare(otp, hashedOTP);
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
};
