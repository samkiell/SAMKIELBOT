const fs = require("fs");
const path = require("path");

/**
 * LoggerService - Handles automated log rotation and file management
 */
class LoggerService {
  constructor() {
    this.maxLines = 100000;
    this.logsDir = path.join(process.cwd(), "logs");
    this.counters = {};
    this.checkInterval = 1000; // Check rotation every 1000 lines

    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    } else {
      // Initial check for existing large files on startup
      const files = ["bot-health.log", "ptero-console.log"];
      files.forEach((file) => {
        const filePath = path.join(this.logsDir, file);
        if (fs.existsSync(filePath)) {
          this.rotateIfNeeded(filePath, file);
        }
      });
    }
  }

  /**
   * Log a message to a file with automatic rotation
   * @param {string} filename - Name of the log file
   * @param {string} message - Content to log
   */
  log(filename, message) {
    try {
      const filePath = path.join(this.logsDir, filename);
      const timestamp = new Date().toISOString();
      const entry = `[${timestamp}] ${message}\n`;

      // Use synchronous write to avoid EMFILE issues with too many concurrent async operations
      // Sync writes ensure the file descriptor is closed immediately
      fs.appendFileSync(filePath, entry);

      // Track line count roughly
      this.counters[filename] = (this.counters[filename] || 0) + 1;

      // Every X lines, check if rotation is needed
      if (this.counters[filename] >= this.checkInterval) {
        this.rotateIfNeeded(filePath, filename);
        this.counters[filename] = 0;
      }
    } catch (error) {
      if (error.code === "EMFILE") {
        console.error(
          `[Logger] SYSTEM ERROR: EMFILE - Too many open files. Log skipped: ${filename}`
        );
      } else {
        console.error(`[Logger] Write failed to ${filename}:`, error.message);
      }
    }
  }

  /**
   * Check file size/line count and rotate if needed using streams
   */
  rotateIfNeeded(filePath, filename) {
    try {
      if (!fs.existsSync(filePath)) return;

      const stats = fs.statSync(filePath);

      // Only rotate if file is over 20MB
      if (stats.size > 20 * 1024 * 1024) {
        console.log(
          `[Logger] 🔄 Rotating ${filename} (${(
            stats.size /
            1024 /
            1024
          ).toFixed(2)} MB)...`
        );

        const tempPath = `${filePath}.tmp`;
        const content = fs.readFileSync(filePath, "utf8");
        const lines = content.split("\n");

        if (lines.length >= this.maxLines) {
          // Keep last 10,000 lines
          const preservedLines = lines.slice(-10000);
          fs.writeFileSync(filePath, preservedLines.join("\n"));
          console.log(
            `[Logger] ✅ ${filename} rotated. Preserved 10,000 lines.`
          );
        }
      }
    } catch (error) {
      if (error.code !== "EBUSY") {
        console.error(
          `[Logger] Rotation failed for ${filename}:`,
          error.message
        );
      }
    }
  }
}

module.exports = new LoggerService();
