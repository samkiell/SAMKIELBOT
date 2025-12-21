/**
 * Unified Bot Status Engine
 * Handles the logic of determining a bot's state based on multiple signals.
 * Rules are prioritized from most restrictive (Suspension) to most active.
 */

const BOT_STATUS = {
  SUSPENDED: "suspended",
  STOPPED: "stopped",
  OFFLINE: "offline",
  INSTALLING: "installing",
  AWAITING_PAIRING: "awaiting_pairing",
  CONNECTED: "connected",
  ACTIVE: "active",
  FAILED: "failed",
};

/**
 * Resolves the unified status of a bot.
 *
 * @param {Object} data - Input signals
 * @param {Date|null} data.lastHeartbeatAt - Time of last bot signal
 * @param {Date|null} data.lastActivityAt - Time of last message/command processed
 * @param {boolean} data.isPaired - Whether the bot is linked to WhatsApp
 * @param {string} data.pteroState - Current power state from Pterodactyl (running, offline, starting, installing)
 * @param {number} data.credits - User's current credit balance
 * @param {boolean} data.isSuspended - Explicit suspension flag
 * @returns {string} One of BOT_STATUS values
 */
function resolveBotStatus({
  lastHeartbeatAt,
  lastActivityAt,
  isPaired,
  pteroState,
  credits,
  isSuspended,
}) {
  const now = Date.now();
  const HEARTBEAT_TIMEOUT = 3 * 60 * 1000; // 3 minutes
  const ACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  // 1. SYSTEM CRITICAL: Suspension or Lack of Credits
  // Highest priority: If the bot is blocked by the system, other states don't matter.
  if (isSuspended || (credits !== undefined && credits < 1)) {
    return BOT_STATUS.SUSPENDED;
  }

  // 2. INFRASTRUCTURE STATE: Pterodactyl Power State
  // If the container isn't running, it can't be functional.
  if (pteroState === "installing") return BOT_STATUS.INSTALLING;
  if (!pteroState || pteroState === "offline") return BOT_STATUS.STOPPED;

  if (pteroState === "starting") return "starting"; // Starting is a transition state

  // 3. NETWORK/PROCESS HEALTH: Heartbeat
  // If server is "running" but hasn't pinged the backend, it's either crashing or stuck.
  const isHeartbeatStale =
    !lastHeartbeatAt ||
    now - new Date(lastHeartbeatAt).getTime() > HEARTBEAT_TIMEOUT;
  if (isHeartbeatStale) {
    return BOT_STATUS.OFFLINE;
  }

  // 4. FUNCTIONAL STATE: WhatsApp Link
  // Process is healthy, but is it linked to the platform?
  if (!isPaired) {
    return BOT_STATUS.AWAITING_PAIRING;
  }

  // 5. ACTIVITY STATE: Connected vs Active
  // Is the bot just "sitting there" or actually doing work?
  const isRecentlyActive =
    lastActivityAt &&
    now - new Date(lastActivityAt).getTime() < ACTIVITY_THRESHOLD;
  if (isRecentlyActive) {
    return BOT_STATUS.ACTIVE;
  }

  return BOT_STATUS.CONNECTED;
}

module.exports = {
  BOT_STATUS,
  resolveBotStatus,
};
