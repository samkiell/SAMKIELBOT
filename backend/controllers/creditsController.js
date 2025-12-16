const User = require("../models/User");
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

    res.json({
      success: true,
      data: {
        credits: Math.round(user.credits),
        referralCode: user.referralCode,
        totalReferrals: user.totalReferrals,
        stats,
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
      await require("../models/CreditTransaction").findOne({
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
    await require("../models/Notification").create({
      user: userId,
      title: "Credits Purchased! 💳",
      message: `You successfully purchased ${credits} credits. New balance: ${Math.round(
        newBalance
      )} credits.`,
      type: "success",
    });

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.emit("credits:updated", {
        userId,
        credits: Math.round(newBalance),
      });
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

    const history = await creditService.getCreditHistory(userId, limit);

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

module.exports = exports;
