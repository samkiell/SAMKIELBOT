const User = require("../models/User");
const Plan = require("../models/Plan");
const Subscription = require("../models/Subscription");
const Deployment = require("../models/Deployment");
const Notification = require("../models/Notification");

/**
 * Get user's effective resource limits based on account type and plan
 */
async function getUserLimits(userId) {
  const user = await User.findById(userId).populate("currentPlan");

  if (!user) {
    throw new Error("User not found");
  }

  // FREE account limits
  const FREE_LIMITS = {
    maxBots: 1,
    cpuLimit: 25,
    ramLimit: 300,
    diskLimit: 500,
  };

  // If user is PREMIUM and has an active subscription
  if (
    user.accountType === "PREMIUM" &&
    user.subscriptionStatus === "active" &&
    user.currentPlan
  ) {
    return {
      accountType: "PREMIUM",
      planName: user.currentPlan.name,
      maxBots: user.currentPlan.maxBots,
      cpuLimit: user.currentPlan.cpuLimit,
      ramLimit: user.currentPlan.ramLimit,
      diskLimit: user.currentPlan.diskLimit,
    };
  }

  // Default to FREE limits
  return {
    accountType: "FREE",
    planName: "Free",
    ...FREE_LIMITS,
  };
}

/**
 * Check if user can create a new bot
 */
async function canCreateBot(userId) {
  const limits = await getUserLimits(userId);
  const userBots = await Deployment.countDocuments({
    user: userId,
    status: { $nin: ["failed", "suspended"] },
  });

  return {
    allowed: userBots < limits.maxBots,
    currentCount: userBots,
    maxAllowed: limits.maxBots,
    accountType: limits.accountType,
  };
}

/**
 * Upgrade user to PREMIUM
 */
async function upgradeUserToPremium(userId, planId, subscriptionData) {
  const user = await User.findById(userId);
  const plan = await Plan.findById(planId);

  if (!user || !plan) {
    throw new Error("User or Plan not found");
  }

  // Calculate expiration (30 days from now for monthly)
  const expiresAt = new Date();
  if (plan.billingCycle === "monthly") {
    expiresAt.setDate(expiresAt.getDate() + 30);
  } else if (plan.billingCycle === "yearly") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }

  // Update user
  user.accountType = "PREMIUM";
  user.currentPlan = planId;
  user.subscriptionStatus = "active";
  user.subscriptionExpiresAt = expiresAt;
  await user.save();

  // Create subscription record
  const subscription = new Subscription({
    user: userId,
    plan: planId,
    paystackReference: subscriptionData.reference,
    paystackCustomerCode: subscriptionData.customerCode,
    amount: subscriptionData.amount,
    status: "active",
    startedAt: new Date(),
    expiresAt,
    paymentHistory: [
      {
        reference: subscriptionData.reference,
        amount: subscriptionData.amount,
        status: "success",
        paidAt: new Date(),
      },
    ],
  });

  await subscription.save();

  // Send notification
  await Notification.create({
    user: userId,
    title: "Premium Activated! 🚀",
    message: `Your ${plan.displayName} subscription is now active. Enjoy premium features!`,
    type: "success",
  });

  return { user, subscription };
}

/**
 * Downgrade user to FREE
 */
async function downgradeUserToFree(userId, reason = "subscription_expired") {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const previousPlan = user.currentPlan;

  // Update user to FREE
  user.accountType = "FREE";
  user.currentPlan = null;
  user.subscriptionStatus = "inactive";
  user.subscriptionExpiresAt = null;
  await user.save();

  // Handle excess bots
  await handleExcessBots(userId);

  // Send notification
  let message = "Your account has been downgraded to Free.";
  if (reason === "subscription_expired") {
    message =
      "Your premium subscription has expired. You've been downgraded to the Free plan.";
  } else if (reason === "payment_failed") {
    message =
      "Payment failed. Your account has been downgraded to the Free plan.";
  }

  await Notification.create({
    user: userId,
    title: "Account Downgraded",
    message,
    type: "warning",
  });

  return user;
}

/**
 * Handle excess bots when user downgrades
 */
async function handleExcessBots(userId) {
  const limits = await getUserLimits(userId);
  const userBots = await Deployment.find({
    user: userId,
    status: { $nin: ["failed", "suspended"] },
  }).sort({ deployedAt: 1 }); // Oldest first

  if (userBots.length > limits.maxBots) {
    const excessBots = userBots.slice(limits.maxBots);

    for (const bot of excessBots) {
      bot.status = "suspended";
      await bot.save();

      // Notify about suspended bot
      await Notification.create({
        user: userId,
        title: "Bot Suspended",
        message: `Your bot "${bot.botName}" has been suspended due to account downgrade. Upgrade to reactivate.`,
        type: "warning",
      });
    }
  }
}

/**
 * Send expiration warning notification
 */
async function sendExpirationWarning(userId, daysRemaining) {
  await Notification.create({
    user: userId,
    title: "Subscription Expiring Soon ⚠️",
    message: `Your premium subscription expires in ${daysRemaining} days. Renew now to keep your benefits!`,
    type: "warning",
  });
}

/**
 * Check and handle expired subscriptions
 */
async function checkExpiredSubscriptions() {
  const now = new Date();

  // Find active subscriptions that have expired
  const expiredSubscriptions = await Subscription.find({
    status: "active",
    expiresAt: { $lte: now },
  });

  console.log(
    `[Billing] Found ${expiredSubscriptions.length} expired subscriptions`
  );

  for (const subscription of expiredSubscriptions) {
    // Mark subscription as expired
    subscription.status = "expired";
    await subscription.save();

    // Downgrade user
    await downgradeUserToFree(subscription.user, "subscription_expired");
  }

  // Find subscriptions expiring in 7 days
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const expiringSoon = await Subscription.find({
    status: "active",
    expiresAt: { $gte: now, $lte: sevenDaysFromNow },
  });

  for (const subscription of expiringSoon) {
    const daysRemaining = Math.ceil(
      (subscription.expiresAt - now) / (1000 * 60 * 60 * 24)
    );
    await sendExpirationWarning(subscription.user, daysRemaining);
  }
}

module.exports = {
  getUserLimits,
  canCreateBot,
  upgradeUserToPremium,
  downgradeUserToFree,
  handleExcessBots,
  sendExpirationWarning,
  checkExpiredSubscriptions,
};
