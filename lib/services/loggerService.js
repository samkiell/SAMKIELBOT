const fs = require("fs");
const path = require("path");

/**
 * LoggerService - Handles logging (File-based locally, Console-based in Production)
 */
class LoggerService {
  constructor() {
    this.isProduction = process.env.NODE_ENV === "production";
    this.logsDir = path.join(process.cwd(), "logs");

    // Only attempt to create directory if NOT in production (Serverless Read-Only FS)
    if (!this.isProduction) {
      if (!fs.existsSync(this.logsDir)) {
        try {
          fs.mkdirSync(this.logsDir, { recursive: true });
        } catch (err) {
          console.error(
            "[Logger] Failed to create logs directory:",
            err.message
          );
          // Fallback to production mode if FS is read-only
          this.isProduction = true;
        }
      }
    }
  }

  /**
   * Log a message
   * @param {string} filename - Name of the log file (Ignored in Prod)
   * @param {string} message - Content to log
   */
  log(filename, message) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${filename}] ${message}`;

    // In production (Vercel), just log to console (stdout is captured)
    if (this.isProduction) {
      console.log(formattedMessage);
      return;
    }

    // In development, try writing to file
    try {
      const filePath = path.join(this.logsDir, filename);
      fs.appendFileSync(filePath, formattedMessage + "\n");
    } catch (error) {
      // If write fails (e.g. read-only FS), fallback to console
      console.error(
        `[Logger] Write failed, falling back to console: ${error.message}`
      );
      console.log(formattedMessage);
    }
  }

  // No-op for rotation in serverless/production
  rotateIfNeeded(filePath, filename) {
    return;
  }
}

module.exports = new LoggerService();
