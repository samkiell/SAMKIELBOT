const User = require("../../models/User");
const Deployment = require("../../models/Deployment");
const CreditTransaction = require("../../models/CreditTransaction");
const Notification = require("../../models/Notification");
const Referral = require("../../models/Referral");

// Credit pricing for resources
const RESOURCE_PRICING = {
  cpu: {
    25: 0,
    30: 5,
    40: 10,
    50: 20,
  },
  ram: {
    300: 0,
    500: 10,
    1024: 25,
    2048: 50,
  },
  disk: {
    500: 0,
    1024: 10,
    2048: 20,
  },
};

// Daily burn rates
const DAILY_BURN_RATES = {
  base: 2,
  cpu: {
    25: 0,
    30: 1,
    40: 1,
    50: 2,
  },
  ram: {
    300: 0,
    500: 1,
    1024: 1,
    2048: 2,
  },
};

const BOT_CREATION_COST = 50;

/**
 * Calculate deployment cost based on resources
 */
function calculateDeploymentCost(cpu, ram, disk) {
  const cpuCost = RESOURCE_PRICING.cpu[cpu] || 0;
  const ramCost = RESOURCE_PRICING.ram[ram] || 0;
  const diskCost = RESOURCE_PRICING.disk[disk] || 0;

  const resourceCost = cpuCost + ramCost + diskCost;
  const totalCost = BOT_CREATION_COST + resourceCost;

  return {
    creationCost: BOT_CREATION_COST,
    resourceCost,
    totalCost,
  };
}

/**
 * Calculate daily burn rate for a bot
 */
function calculateDailyBurn(cpu, ram) {
  // Hardcoded to 5 for now as per requirements
  return 5;
}

/**
 * Check if user has sufficient credits
 */
async function hasSufficientCredits(userId, amount) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  return user.credits >= amount;
}

/**
 * Deduct credits from user
 */
async function deductCredits(userId, amount, type, description, metadata = {}) {
  // Round to prevent floating-point errors
  const roundedAmount = Math.round(amount);

  const user = await User.findOneAndUpdate(
    { _id: userId, credits: { $gte: roundedAmount } },
    { $inc: { credits: -roundedAmount } },
    { new: true }
  );

  if (!user) {
    const checkUser = await User.findById(userId);
    if (!checkUser) throw new Error("User not found");
    throw new Error("Insufficient credits");
  }

  // Record transaction
  await CreditTransaction.create({
    user: userId,
    type,
    amount: -roundedAmount,
    balanceAfter: user.credits,
    description,
    ...metadata,
  });

  return user.credits;
}

/**
 * Add credits to user
 */
async function addCredits(userId, amount, type, description, metadata = {}) {
  // Round to prevent floating-point errors
  const roundedAmount = Math.round(amount);

  const user = await User.findOneAndUpdate(
    { _id: userId },
    { $inc: { credits: roundedAmount } },
    { new: true }
  );

  if (!user) throw new Error("User not found");

  // Record transaction
  await CreditTransaction.create({
    user: userId,
    type,
    amount: roundedAmount,
    balanceAfter: user.credits,
    description,
    ...metadata,
  });

  return user.credits;
}

/**
 * Process referral reward
 */
async function processReferral(newUserId, referralCode) {
  if (!referralCode) return;

  // Find referrer
  const referrer = await User.findOne({ username: referralCode });
  if (!referrer) {
    console.log(`[Credits] Invalid referral code: ${referralCode}`);
    return;
  }

  const newUser = await User.findById(newUserId);
  if (!newUser) return;

  // Prevent self-referral
  if (referrer._id.toString() === newUserId.toString()) {
    console.log("[Credits] Self-referral blocked");
    return;
  }

  // Check if already claimed
  if (newUser.referralRewardClaimed) {
    console.log("[Credits] Referral reward already claimed");
    return;
  }

  // Create Referral record
  try {
    await Referral.create({
      referrerId: referrer._id,
      referredUserId: newUserId,
      creditsAwarded: true,
    });
  } catch (err) {
    console.error("[Credits] Failed to create Referral record:", err.message);
  }

  // Award credits to both users
  await addCredits(
    referrer._id,
    10,
    "referral_reward",
    `Referral reward for inviting ${newUser.username}`,
    { referredUser: newUserId },
  );

  await addCredits(
    newUserId,
    10,
    "referral_reward",
    `Referral bonus from ${referrer.username}`,
    { referredUser: referrer._id },
  );

  // Update referrer stats
  referrer.totalReferrals += 1;
  referrer.referralCount += 1;
  await referrer.save();

  // Mark reward as claimed
  newUser.referralRewardClaimed = true;
  newUser.referredBy = referrer._id;
  await newUser.save();

  // Send notifications
  await Notification.create({
    user: referrer._id,
    title: "Referral Reward! 🎉",
    message: `You earned 10 credits for referring ${newUser.username}!`,
    type: "success",
  });

  await Notification.create({
    user: newUserId,
    title: "Welcome Bonus! 🎁",
    message: `You received 10 bonus credits from ${referrer.username}'s referral!`,
    type: "success",
  });

  console.log(
    `[Credits] Referral processed: ${referrer.username} → ${newUser.username}`,
  );
}

/**
 * Process daily burn for all active bots
 */
/**
 * Process renewal for a single bot if due
 */
async function processBotRenewal(deploymentId) {
  const pterodactyl = require("../utils/pterodactyl");
  const now = new Date();

  const bot = await Deployment.findById(deploymentId).populate("user");
  if (!bot || !bot.user || bot.billingStatus !== "active") return bot;

  // Check if renewal is actually due
  if (!bot.nextRenewalAt || bot.nextRenewalAt > now) return bot;

  const msPerDay = 24 * 60 * 60 * 1000;
  const overdueMs = now.getTime() - new Date(bot.nextRenewalAt).getTime();
  const daysToBill = Math.floor(overdueMs / msPerDay) + 1;

  if (daysToBill <= 0) return bot;

  console.log(
    `[Credits] Catch-up renewal for bot: ${bot.botName} - Billing ${daysToBill} days`,
  );

  const user = bot.user;
  const dailyRate = bot.dailyBurn || 5;
  const totalAmountDue = dailyRate * daysToBill;

  if (user.credits >= totalAmountDue) {
    // Deduct credits for all missed days
    await deductCredits(
      user._id,
      totalAmountDue,
      "daily_renewal",
      `Catch-up renewal for bot: ${bot.botName} (${daysToBill} days)`,
      { deployment: bot._id, daysBilled: daysToBill },
    );

    // Update timestamps
    bot.lastRenewedAt = now;
    bot.lastBurnDate = now;
    bot.nextRenewalAt = new Date(
      new Date(bot.nextRenewalAt).getTime() + daysToBill * msPerDay,
    );
    bot.totalCreditsSpent = (bot.totalCreditsSpent || 0) + totalAmountDue;
    await bot.save();

    console.log(
      `[Credits] Catch-up renewal successful for ${bot.botName}. Deducted ${totalAmountDue} credits for ${daysToBill} days.`,
    );
  } else {
    // Partially bill as many days as possible, then suspend
    const daysAffordable = Math.floor(user.credits / dailyRate);

    if (daysAffordable > 0) {
      const partialAmount = daysAffordable * dailyRate;
      await deductCredits(
        user._id,
        partialAmount,
        "daily_renewal",
        `Partial catch-up for bot: ${bot.botName} (${daysAffordable} days)`,
        { deployment: bot._id, daysBilled: daysAffordable },
      );

      bot.totalCreditsSpent = (bot.totalCreditsSpent || 0) + partialAmount;
      bot.nextRenewalAt = new Date(
        new Date(bot.nextRenewalAt).getTime() + daysAffordable * msPerDay,
      );
    }

    console.log(
      `[Credits] Suspending ${bot.botName} due to insufficient balance for full catch-up.`,
    );

    bot.status = "suspended";
    bot.billingStatus = "suspended";
    bot.lastBurnDate = now;
    await bot.save();

    try {
      if (bot.identifier) {
        await pterodactyl.requestPowerAction(bot.identifier, "stop");
      }
    } catch (e) {}

    // Notify user
    await Notification.create({
      user: user._id,
      title: "Bot Suspended 🔴",
      message: `Your bot "${bot.botName}" was suspended after attempting to catch up on ${daysToBill} days of usage. Please add credits to resume.`,
      type: "error",
    });
  }

  return bot;
}

/**
 * Process daily burn for all active bots
 * IDEMPOTENT: Uses lastBurnDate to prevent double-charging on restarts/overlaps
 */
async function processDailyBurn() {
  const pterodactyl = require("../utils/pterodactyl");
  const now = new Date();

  // Create a unique billing period identifier (YYYY-MM-DD in UTC) for idempotency
  const billingPeriod = now.toISOString().split("T")[0];

  // Find bots whose 'nextRenewalAt' is in the past (due for renewal)
  // Expanded statuses to include awaiting_pairing and online/active states
  const activeBots = await Deployment.find({
    status: {
      $in: [
        "active",
        "running",
        "connected",
        "paired",
        "starting",
        "online",
        "degraded",
        "awaiting_pairing",
        "installing",
      ],
    },
    billingStatus: "active",
    nextRenewalAt: { $lte: now },
  }).populate("user");

  console.log(
    `[Credits] Running Daily Renewal for ${activeBots.length} bots (Period: ${billingPeriod})`,
  );

  let totalBurned = 0;
  let botsSuspended = 0;
  let skipped = 0;

  for (const bot of activeBots) {
    try {
      const user = bot.user;
      if (!user) continue;

      const dailyRate = bot.dailyBurn || 5;
      const msPerDay = 24 * 60 * 60 * 1000;
      const overdueMs = now.getTime() - new Date(bot.nextRenewalAt).getTime();
      const daysToBill = Math.floor(overdueMs / msPerDay) + 1;

      if (daysToBill <= 0) continue;

      // 🔒 IDEMPOTENCY CHECK: Prevent double-billing for same day if already processed recently
      const lastBurnDateStr = bot.lastBurnDate
        ? new Date(bot.lastBurnDate).toISOString().split("T")[0]
        : null;

      if (lastBurnDateStr === billingPeriod && daysToBill === 0) {
        // Only skip if no new days are due
        skipped++;
        continue;
      }

      const totalAmountDue = dailyRate * daysToBill;

      // Check if user has sufficient credits
      if (user.credits >= totalAmountDue) {
        // Deduct credits
        await deductCredits(
          user._id,
          totalAmountDue,
          "daily_renewal",
          `Renewal for bot: ${bot.botName} (${daysToBill} days catch-up)`,
          { deployment: bot._id, billingPeriod, daysBilled: daysToBill },
        );

        // Update timestamps
        bot.lastRenewedAt = now;
        bot.lastBurnDate = now;
        bot.nextRenewalAt = new Date(
          new Date(bot.nextRenewalAt).getTime() + daysToBill * msPerDay,
        );

        bot.totalCreditsSpent = (bot.totalCreditsSpent || 0) + totalAmountDue;
        bot.billingStatus = "active";
        await bot.save();

        totalBurned += totalAmountDue;

        // Notification for daily deduction
        await Notification.create({
          user: user._id,
          title: "Bot Renewed 💸",
          message: `Deducted ${totalAmountDue} credits for ${daysToBill} days of renewal for "${bot.botName}". Remaining balance: ${Math.round(user.credits)} credits.`,
          type: "info",
        });

        // Warn if credits are low (<3 days remaining)
        if (user.credits < dailyRate * 3) {
          await Notification.create({
            user: user._id,
            title: "Low Credits Warning ⚠️",
            message: `Your credits are running low (${Math.round(
              user.credits,
            )} remaining). Your bot "${bot.botName}" may be suspended soon.`,
            type: "warning",
          });
        }
      } else {
        // Insufficient credits - process partial then suspend
        console.log(`[Credits] Suspending ${bot.botName} due to insufficient balance.`);

        const daysAffordable = Math.floor(user.credits / dailyRate);
        if (daysAffordable > 0) {
          const partialAmount = daysAffordable * dailyRate;
          await deductCredits(
            user._id,
            partialAmount,
            "daily_renewal",
            `Partial renewal for bot: ${bot.botName} (${daysAffordable} days)`,
            { deployment: bot._id, daysBilled: daysAffordable },
          );
          bot.totalCreditsSpent = (bot.totalCreditsSpent || 0) + partialAmount;
          bot.nextRenewalAt = new Date(
            new Date(bot.nextRenewalAt).getTime() + daysAffordable * msPerDay,
          );
        }

        bot.status = "suspended";
        bot.billingStatus = "suspended";
        bot.lastBurnDate = now;
        await bot.save();

        // 🛑 REAL POWER ACTION: Stop the server
        try {
          if (bot.identifier) {
            await pterodactyl.requestPowerAction(bot.identifier, "stop");
          }
        } catch (pteroErr) {
          console.error(`[Credits] Ptero power off fail for ${bot.identifier}:`, pteroErr.message);
        }

        botsSuspended++;

        await Notification.create({
          user: user._id,
          title: "Bot Suspended 🔴",
          message: `Your bot "${bot.botName}" was suspended due to insufficient credits. Catch-up failed.`,
          type: "error",
        });
      }
    } catch (error) {
      console.error(`[Credits] Error processing bot ${bot._id}:`, error);
    }
  }

  console.log(
    `[Credits] Daily renewal complete: ${totalBurned} credits burned, ${botsSuspended} bots suspended, ${skipped} skipped (already billed)`,
  );

  return { totalBurned, botsSuspended, skipped };
}

/**
 * Get credit transaction history
 */
async function getCreditHistory(userId, limit = 50, deploymentId = null) {
  const query = { user: userId };
  if (deploymentId) {
    query.deployment = deploymentId;
  }

  return await CreditTransaction.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("referredUser", "username")
    .populate("deployment", "botName");
}

/**
 * Get credit statistics
 */
async function getCreditStats(userId) {
  const transactions = await CreditTransaction.find({ user: userId });

  const stats = {
    totalEarned: 0,
    totalSpent: 0,
    totalPurchased: 0,
    totalReferrals: 0,
  };

  transactions.forEach((tx) => {
    if (tx.amount > 0) {
      stats.totalEarned += tx.amount;
      if (tx.type === "purchase") stats.totalPurchased += tx.amount;
      if (tx.type === "referral_reward") stats.totalReferrals += tx.amount;
    } else {
      stats.totalSpent += Math.abs(tx.amount);
    }
  });

  return stats;
}

module.exports = {
  RESOURCE_PRICING,
  DAILY_BURN_RATES,
  BOT_CREATION_COST,
  calculateDeploymentCost,
  calculateDailyBurn,
  hasSufficientCredits,
  deductCredits,
  addCredits,
  processReferral,
  processDailyBurn,
  processBotRenewal,
  getCreditHistory,
  getCreditStats,
};
