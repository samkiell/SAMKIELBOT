const User = require("../models/User");
const Deployment = require("../models/Deployment");
const CreditTransaction = require("../models/CreditTransaction");
const Notification = require("../models/Notification");

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
  const baseBurn = DAILY_BURN_RATES.base;
  const cpuBurn = DAILY_BURN_RATES.cpu[cpu] || 0;
  const ramBurn = DAILY_BURN_RATES.ram[ram] || 0;

  return baseBurn + cpuBurn + ramBurn;
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
  const referrer = await User.findOne({ referralCode });
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
async function processDailyBurn() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find all active bots that haven't been burned today
  const activeBots = await Deployment.find({
    status: { $in: ["active", "running", "connected"] },
    $or: [{ lastBurnDate: { $lt: today } }, { lastBurnDate: null }],
  }).populate("user");

  console.log(`[Credits] Processing daily burn for ${activeBots.length} bots`);

  let totalBurned = 0;
  let botsSuspended = 0;

  for (const bot of activeBots) {
    try {
      const user = bot.user;
      const burnAmount = bot.dailyBurn;

      // Check if user has sufficient credits
      if (user.credits >= burnAmount) {
        // Deduct credits
        await deductCredits(
          user._id,
          burnAmount,
          "daily_burn",
          `Daily burn for bot: ${bot.botName}`,
          { deployment: bot._id }
        );

        bot.lastBurnDate = new Date();
        await bot.save();

        totalBurned += burnAmount;

        // Warn if credits are low
        if (user.credits < burnAmount * 3) {
          await Notification.create({
            user: user._id,
            title: "Low Credits Warning ⚠️",
            message: `Your credits are running low (${Math.round(
              user.credits
            )} remaining). Your bots may be suspended soon.`,
            type: "warning",
          });
        }
      } else {
        // Insufficient credits - suspend bot
        bot.status = "suspended";
        bot.lastBurnDate = new Date();
        await bot.save();

        botsSuspended++;

        await Notification.create({
          user: user._id,
          title: "Bot Suspended 🔴",
          message: `Your bot "${bot.botName}" was suspended due to insufficient credits. Buy credits to reactivate.`,
          type: "error",
        });

        console.log(
          `[Credits] Bot suspended: ${bot.botName} (User: ${user.username})`
        );
      }
    } catch (error) {
      console.error(`[Credits] Error processing bot ${bot._id}:`, error);
    }
  }

  console.log(
    `[Credits] Daily burn complete: ${totalBurned} credits burned, ${botsSuspended} bots suspended`
  );

  return { totalBurned, botsSuspended };
}

/**
 * Get credit transaction history
 */
async function getCreditHistory(userId, limit = 50) {
  return await CreditTransaction.find({ user: userId })
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
  getCreditHistory,
  getCreditStats,
};
