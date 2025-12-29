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
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Round to prevent floating-point errors
  const roundedAmount = Math.round(amount);

  if (user.credits < roundedAmount) {
    throw new Error("Insufficient credits");
  }

  user.credits = Math.round(user.credits - roundedAmount);
  await user.save();

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
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // Round to prevent floating-point errors
  const roundedAmount = Math.round(amount);

  user.credits = Math.round(user.credits + roundedAmount);
  await user.save();

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
    { referredUser: newUserId }
  );

  await addCredits(
    newUserId,
    10,
    "referral_reward",
    `Referral bonus from ${referrer.username}`,
    { referredUser: referrer._id }
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
    `[Credits] Referral processed: ${referrer.username} → ${newUser.username}`
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

  console.log(`[Credits] Proactive specific renewal for bot: ${bot.botName}`);

  const user = bot.user;
  const burnAmount = 5;

  if (user.credits >= burnAmount) {
    // Deduct credits
    await deductCredits(
      user._id,
      burnAmount,
      "daily_renewal",
      `Specific proactive renewal for bot: ${bot.botName}`,
      { deployment: bot._id }
    );

    // Update timestamps
    bot.lastRenewedAt = now;
    bot.nextRenewalAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    bot.totalCreditsSpent = (bot.totalCreditsSpent || 0) + burnAmount;
    await bot.save();

    console.log(`[Credits] Proactive renewal successful for ${bot.botName}`);
  } else {
    // Suspend
    console.log(
      `[Credits] Suspending ${bot.botName} due to zero balance (Proactive).`
    );
    bot.status = "suspended";
    bot.billingStatus = "suspended";
    await bot.save();

    try {
      if (bot.identifier) {
        await pterodactyl.requestPowerAction(bot.identifier, "stop");
      }
    } catch (e) {}
  }

  return bot;
}

/**
 * Process daily burn for all active bots
 */
async function processDailyBurn() {
  const pterodactyl = require("../utils/pterodactyl");
  // Use UTC to ensure consistency across servers
  const now = new Date();

  // Find bots whose 'nextRenewalAt' is in the past (due for renewal)
  // OR bots that somehow missed it (fallback to yesterday check not needed if we check date)
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
        "suspension",
      ],
    }, // Check suspended too? No, only active bots consume credits basically. BUT wait, requirements say renewal is recurring.
    // Actually, "Suspended bots cannot run". So if suspended, we don't charge?
    // Requirement 4: "Restart is allowed only if credits >= 5 ... Deduct renewal credits".
    // So we only charge active bots.
    billingStatus: "active", // Only charge active billing status
    nextRenewalAt: { $lte: now }, // Due for renewal
  }).populate("user");

  console.log(
    `[Credits] Running Daily Renewal for ${
      activeBots.length
    } bots (Time: ${now.toISOString()})`
  );

  let totalBurned = 0;
  let botsSuspended = 0;

  for (const bot of activeBots) {
    try {
      const user = bot.user;
      if (!user) continue;

      const burnAmount = 5; // Fixed daily cost as per requirement

      // Check if user has sufficient credits
      if (user.credits >= burnAmount) {
        // Deduct credits
        await deductCredits(
          user._id,
          burnAmount,
          "daily_renewal",
          `Daily renewal for bot: ${bot.botName}`,
          { deployment: bot._id }
        );

        // Update timestamps
        bot.lastRenewedAt = now;
        bot.nextRenewalAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hours
        bot.totalCreditsSpent = (bot.totalCreditsSpent || 0) + burnAmount;
        bot.billingStatus = "active";
        await bot.save();

        totalBurned += burnAmount;

        // Warn if credits are low (< 3 days remaining)
        if (user.credits < burnAmount * 3) {
          const Notification = require("../../models/Notification");
          await Notification.create({
            user: user._id,
            title: "Low Credits Warning ⚠️",
            message: `Your credits are running low (${Math.round(
              user.credits
            )} remaining). Your bot "${bot.botName}" may be suspended soon.`,
            type: "warning",
          });
        }
      } else {
        // Insufficient credits - suspend bot IN REALITY
        console.log(`[Credits] Suspending ${bot.botName} due to zero balance.`);

        bot.status = "suspended";
        bot.billingStatus = "suspended";
        bot.billingStatus = "suspended";
        await bot.save();

        // 🛑 REAL POWER ACTION: Stop the server on Pterodactyl
        try {
          if (bot.identifier) {
            await pterodactyl.requestPowerAction(bot.identifier, "stop");
          }
        } catch (pteroErr) {
          console.error(
            `[Credits] Failed to power off Ptero server ${bot.identifier}:`,
            pteroErr.message
          );
        }

        botsSuspended++;

        const Notification = require("../../models/Notification");
        await Notification.create({
          user: user._id,
          title: "Bot Suspended 🔴",
          message: `Your bot "${bot.botName}" was suspended due to insufficient credits. Please purchase credits to reactivate.`,
          type: "error",
        });
      }
    } catch (error) {
      console.error(`[Credits] Error processing bot ${bot._id}:`, error);
    }
  }

  console.log(
    `[Credits] Daily renewal complete: ${totalBurned} credits burned, ${botsSuspended} bots suspended`
  );

  return { totalBurned, botsSuspended };
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
