const User = require("../../models/User");
const creditService = require("../services/creditService");
const paystackService = require("../services/paystackService");
const crypto = require("crypto");

// Credit packages
const CREDIT_PACKAGES = [
  { credits: 50, price: 500, popular: false },
  { credits: 120, price: 1000, popular: true },
  { credits: 260, price: 2000, popular: false },
  { credits: 700, price: 5000, popular: false },
];

/**
 * Get user's credit balance and stats
 */
exports.getCreditBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const stats = await creditService.getCreditStats(userId);

    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.json({
      success: true,
      data: {
        credits: Math.round(user.credits),
        referralCode: user.username,
        totalReferrals: user.totalReferrals,
        referralCount: user.referralCount,
        stats,
        dailyClaim: {
          canClaim: (() => {
            const now = new Date();
            // User requested UTC-1 for claim boundary
            const offsetNow = new Date(now.getTime() - 1 * 60 * 60 * 1000);

            const startOfTodayUTC = new Date(
              Date.UTC(
                offsetNow.getUTCFullYear(),
                offsetNow.getUTCMonth(),
                offsetNow.getUTCDate()
              )
            );

            // Allow claim if never claimed OR if last claim was before today's 00:00 UTC
            const eligibility =
              !user.lastDailyClaim ||
              new Date(user.lastDailyClaim) < startOfTodayUTC;

            console.log(`[Credits] Debug Claim for ${user.username}:`, {
              now: now.toISOString(),
              startOfTodayUTC: startOfTodayUTC.toISOString(),
              lastDailyClaim: user.lastDailyClaim
                ? new Date(user.lastDailyClaim).toISOString()
                : "never",
              eligibility,
            });

            return eligibility;
          })(),
          nextClaimTime: new Date(
            Date.UTC(
              new Date().getUTCFullYear(),
              new Date().getUTCMonth(),
              new Date().getUTCDate() + 1
            )
          ),
          lastClaim: user.lastDailyClaim,
          dailyStreak: user.dailyStreak || 0,
          serverTime: new Date().toISOString(),
          debug: {
            userId: user._id,
            lastClaimRaw: user.lastDailyClaim,
          },
        },
      },
    });
  } catch (error) {
    console.error("[Credits] Get balance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch credit balance",
    });
  }
};

/**
 * Get credit packages
 */
exports.getCreditPackages = async (req, res) => {
  try {
    res.json({
      success: true,
      data: CREDIT_PACKAGES,
    });
  } catch (error) {
    console.error("[Credits] Get packages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch credit packages",
    });
  }
};

/**
 * Initialize credit purchase
 */
exports.initializePurchase = async (req, res) => {
  try {
    const userId = req.user.id;
    const { packageIndex } = req.body;

    const package = CREDIT_PACKAGES[packageIndex];
    if (!package) {
      return res.status(400).json({
        success: false,
        message: "Invalid package",
      });
    }

    const user = await User.findById(userId);
    const reference = `CREDIT_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    // Determine the base URL for the callback
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers["host"] || "localhost:3000";
    const baseUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;
    const callbackUrl = `${baseUrl}/dashboard?payment=success&reference=${reference}`;

    // Initialize payment with Paystack
    const paymentResult = await paystackService.initializePayment({
      email: user.email,
      amount: package.price,
      reference,
      metadata: {
        userId: user._id.toString(),
        username: user.username,
        credits: package.credits,
        type: "credit_purchase",
      },
      callbackUrl,
    });

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: paymentResult.error,
      });
    }

    res.json({
      success: true,
      data: {
        authorizationUrl: paymentResult.data.authorization_url,
        reference: paymentResult.data.reference,
        credits: package.credits,
        amount: package.price,
      },
    });
  } catch (error) {
    console.error("[Credits] Initialize purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize purchase",
    });
  }
};

/**
 * Verify credit purchase
 */
exports.verifyPurchase = async (req, res) => {
  try {
    const { reference } = req.params;
    const userId = req.user.id;

    // Verify with Paystack
    const verificationResult = await paystackService.verifyPayment(reference);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const paymentData = verificationResult.data;

    if (paymentData.status !== "success") {
      return res.status(400).json({
        success: false,
        message: "Payment was not successful",
      });
    }

    // Check if already processed (idempotency)
    const existingTransaction =
      await require("../../models/CreditTransaction").findOne({
        paystackReference: reference,
      });

    if (existingTransaction) {
      return res.json({
        success: true,
        message: "Payment already processed",
        data: {
          credits: existingTransaction.amount,
          balance: existingTransaction.balanceAfter,
        },
      });
    }

    // Add credits to user
    const credits = paymentData.metadata.credits;
    const newBalance = await creditService.addCredits(
      userId,
      credits,
      "purchase",
      `Purchased ${credits} credits for ₦${paymentData.amount / 100}`,
      {
        paystackReference: reference,
        paymentAmount: paymentData.amount / 100,
      }
    );

    // Send notification
    await require("../../models/Notification").create({
      user: userId,
      title: "Credits Purchased! 💳",
      message: `You successfully purchased ${credits} credits. New balance: ${Math.round(
        newBalance
      )} credits.`,
      type: "success",
    });

    // Emit socket event
    const io = res.socket?.server?.io;
    if (io) {
      const user = await User.findById(userId); // Re-fetch user to get updated credits
      io.emit("credits:updated", { userId, credits: user.credits });
    }

    res.json({
      success: true,
      message: "Credits added successfully",
      data: {
        credits,
        balance: Math.round(newBalance),
      },
    });
  } catch (error) {
    console.error("[Credits] Verify purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify purchase",
    });
  }
};

/**
 * Get credit transaction history
 */
exports.getCreditHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const deploymentId = req.query.deploymentId;

    const history = await creditService.getCreditHistory(
      userId,
      limit,
      deploymentId
    );

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("[Credits] Get history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch credit history",
    });
  }
};

/**
 * Calculate deployment cost
 */
exports.calculateCost = async (req, res) => {
  try {
    const { cpu, ram, disk } = req.body;

    const cost = creditService.calculateDeploymentCost(cpu, ram, disk);
    const dailyBurn = creditService.calculateDailyBurn(cpu, ram);

    res.json({
      success: true,
      data: {
        ...cost,
        dailyBurn,
      },
    });
  } catch (error) {
    console.error("[Credits] Calculate cost error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate cost",
    });
  }
};

/**
 * Apply referral code
 */
exports.applyReferral = async (req, res) => {
  try {
    const userId = req.user.id;
    const { referralCode } = req.body;

    await creditService.processReferral(userId, referralCode);

    const user = await User.findById(userId);

    res.json({
      success: true,
      message: "Referral applied successfully",
      data: {
        credits: user.credits,
      },
    });
  } catch (error) {
    console.error("[Credits] Apply referral error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to apply referral",
    });
  }
};

/**
 * Get resource pricing
 */
exports.getResourcePricing = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        botCreationCost: creditService.BOT_CREATION_COST,
        resourcePricing: creditService.RESOURCE_PRICING,
        dailyBurnRates: creditService.DAILY_BURN_RATES,
      },
    });
  } catch (error) {
    console.error("[Credits] Get pricing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pricing",
    });
  }
};

/**
 * Get referral statistics
 */
exports.getReferralStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const Referral = require("@/models/Referral");
    const CreditTransaction = require("@/models/CreditTransaction");

    // Get all referrals
    const referrals = await Referral.find({ referrerId: userId })
      .populate("referredUserId", "username email createdAt")
      .sort({ createdAt: -1 });

    // Calculate total credits earned from referrals
    const referralTransactions = await CreditTransaction.find({
      user: userId,
      type: "referral_reward",
    });

    const totalCreditsEarned = referralTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );

    // Determine the base URL for the referral link
    // Fallback to request host if FRONTEND_URL is not set
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers["host"] || "localhost:3000";
    const baseUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;

    res.json({
      success: true,
      data: {
        referralCode: user.username,
        referralLink: `${baseUrl}/register/ref/${user.username}`,
        totalReferrals: user.totalReferrals || 0,
        referralCount: user.referralCount || 0,
        totalCreditsEarned: Math.round(totalCreditsEarned),
        referrals: referrals.map((r) => ({
          username: r.referredUserId?.username,
          email: r.referredUserId?.email,
          joinedAt: r.createdAt,
          creditsAwarded: r.creditsAwarded,
        })),
      },
    });
  } catch (error) {
    console.error("[Credits] Get referral stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch referral stats",
    });
  }
};

/**
 * Claim daily login credits (5 credits)
 * POST /api/credits/daily-claim
 */
exports.claimDailyCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    const { turnstileToken } = req.body;
    const CREDIT_AMOUNT = 5;

    // 1. Verify Turnstile
    if (!turnstileToken) {
      return res
        .status(400)
        .json({ success: false, message: "Security verification required." });
    }

    const axios = require("axios");
    const turnstileResult = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      }
    );

    if (!turnstileResult.data.success) {
      return res
        .status(400)
        .json({ success: false, message: "Security verification failed." });
    }

    // 2. Calculate UTC-1 Start of Today (00:00:00.000 UTC-1)
    const now = new Date();
    // Offset by -1 hour to align with user's preferred timezone (UTC-1)
    const offsetNow = new Date(now.getTime() - 1 * 60 * 60 * 1000);

    const startOfTodayUTC = new Date(
      Date.UTC(
        offsetNow.getUTCFullYear(),
        offsetNow.getUTCMonth(),
        offsetNow.getUTCDate()
      )
    );

    const nextClaimTime = new Date(startOfTodayUTC);
    nextClaimTime.setUTCDate(nextClaimTime.getUTCDate() + 1);

    // 3. Determine Streak Logic
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check Eligibility manually first to calculate streak accurately
    const lastClaimDate = existingUser.lastDailyClaim
      ? new Date(existingUser.lastDailyClaim)
      : null;

    let isEligible = false;
    if (!lastClaimDate) {
      isEligible = true;
    } else {
      const lastClaimStartOfToday = new Date(
        Date.UTC(
          lastClaimDate.getUTCFullYear(),
          lastClaimDate.getUTCMonth(),
          lastClaimDate.getUTCDate()
        )
      );
      if (lastClaimStartOfToday < startOfTodayUTC) {
        isEligible = true;
      }
    }

    if (!isEligible) {
      const timeRemainingMs = nextClaimTime.getTime() - now.getTime();
      return res.status(400).json({
        success: false,
        message: "Daily credits already claimed today.",
        data: {
          nextClaimTime: nextClaimTime.toISOString(),
          timeRemainingMs,
          canClaim: false,
        },
      });
    }

    // Calculate New Streak
    let newStreak = 1;
    if (lastClaimDate) {
      const yesterdayStartOfTodayUTC = new Date(startOfTodayUTC);
      yesterdayStartOfTodayUTC.setUTCDate(
        yesterdayStartOfTodayUTC.getUTCDate() - 1
      );

      const lastClaimStartOfTodayUTC = new Date(
        Date.UTC(
          lastClaimDate.getUTCFullYear(),
          lastClaimDate.getUTCMonth(),
          lastClaimDate.getUTCDate()
        )
      );

      if (
        lastClaimStartOfTodayUTC.getTime() ===
        yesterdayStartOfTodayUTC.getTime()
      ) {
        // Claimed yesterday, increment streak
        newStreak = (existingUser.dailyStreak || 0) + 1;
      } else {
        // Missed a day or more, reset to 1
        newStreak = 1;
      }
    }

    // Determine Final Amount (15 credits if streak reaches 7)
    let finalAmount = CREDIT_AMOUNT;
    let isMegaClaim = false;

    if (newStreak >= 7) {
      finalAmount = 15;
      isMegaClaim = true;
      // Reset streak after big claim or continue?
      // User said "when 7 days reaches claim will be 15 coins".
      // I'll reset to 1 after 7 so they can work towards it again.
      newStreak = 1;
    }

    // 4. Update User atomicly
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { credits: finalAmount },
        $set: {
          lastDailyClaim: now,
          dailyStreak: newStreak,
        },
      },
      { new: true }
    );

    // 5. Log Transaction
    const CreditTransaction = require("../../models/CreditTransaction");
    await CreditTransaction.create({
      user: userId,
      type: "daily_claim",
      amount: finalAmount,
      balanceAfter: updatedUser.credits,
      description: isMegaClaim
        ? "Daily login reward (7-Day Streak Bonus! 🎉)"
        : `Daily login reward (${newStreak}-day streak)`,
    });

    // 6. Return Success
    res.json({
      success: true,
      message: isMegaClaim
        ? `Incredible! You hit a 7-day streak and earned ${finalAmount} credits! 🎁`
        : `Successfully claimed ${finalAmount} daily credits!`,
      data: {
        credits: updatedUser.credits,
        nextClaimTime: nextClaimTime.toISOString(),
        canClaim: false,
        dailyStreak: updatedUser.dailyStreak,
        isMegaClaim,
      },
    });
  } catch (error) {
    console.error("[Credits] Daily claim error detail:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process daily claim",
      error: error.message,
    });
  }
};

module.exports = exports;
