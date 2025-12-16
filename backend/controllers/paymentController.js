const User = require("../models/User");
const PaymentTransaction = require("../models/PaymentTransaction");
const CreditTransaction = require("../models/CreditTransaction");
const Notification = require("../models/Notification");
const paystackService = require("../services/paystackService");
const creditService = require("../services/creditService");
const crypto = require("crypto");

// Credit packages - Server-side source of truth
const CREDIT_PACKAGES = [
  { id: 1, credits: 50, price: 500, popular: false },
  { id: 2, credits: 120, price: 1000, popular: true },
  { id: 3, credits: 260, price: 2000, popular: false },
  { id: 4, credits: 700, price: 5000, popular: false },
];

/**
 * Initialize payment for credit purchase
 * POST /api/payments/init
 */
exports.initializePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { packageId } = req.body;

    // Validate package ID
    const selectedPackage = CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);
    if (!selectedPackage) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate unique reference
    const reference = `PAY_${Date.now()}_${crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;

    // Create pending payment transaction
    const paymentTransaction = await PaymentTransaction.create({
      user: userId,
      reference,
      amount: selectedPackage.price,
      creditsGranted: selectedPackage.credits,
      status: "pending",
      provider: "paystack",
      metadata: {
        packageId: selectedPackage.id,
        username: user.username,
        email: user.email,
      },
    });

    // Initialize payment with Paystack
    const paymentResult = await paystackService.initializePayment({
      email: user.email,
      amount: selectedPackage.price,
      reference,
      metadata: {
        userId: user._id.toString(),
        username: user.username,
        creditsToGrant: selectedPackage.credits,
        packageId: selectedPackage.id,
        type: "credit_purchase",
      },
    });

    if (!paymentResult.success) {
      paymentTransaction.status = "failed";
      await paymentTransaction.save();

      return res.status(400).json({
        success: false,
        message: paymentResult.error || "Payment initialization failed",
      });
    }

    // Update transaction with Paystack data
    paymentTransaction.paystackData = paymentResult.data;
    await paymentTransaction.save();

    console.log(
      `[Payment] Initialized payment ${reference} for user ${user.username}`
    );

    res.json({
      success: true,
      data: {
        authorization_url: paymentResult.data.authorization_url,
        reference: paymentResult.data.reference,
        credits: selectedPackage.credits,
        amount: selectedPackage.price,
      },
    });
  } catch (error) {
    console.error("[Payment] Initialize error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize payment",
    });
  }
};

/**
 * Verify payment transaction
 * GET /api/payments/verify?reference=xxx
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.query;
    const userId = req.user.id;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Payment reference is required",
      });
    }

    // Find payment transaction
    const paymentTransaction = await PaymentTransaction.findOne({ reference });
    if (!paymentTransaction) {
      return res.status(404).json({
        success: false,
        message: "Payment transaction not found",
      });
    }

    // Verify ownership
    if (paymentTransaction.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to payment",
      });
    }

    // Check if already processed
    if (paymentTransaction.status === "success") {
      return res.json({
        success: true,
        message: "Payment already processed",
        data: {
          credits: paymentTransaction.creditsGranted,
          amount: paymentTransaction.amount,
          status: "success",
        },
      });
    }

    // Verify with Paystack
    const verificationResult = await paystackService.verifyPayment(reference);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const paymentData = verificationResult.data;

    // Validate payment status
    if (paymentData.status !== "success") {
      paymentTransaction.status = "failed";
      await paymentTransaction.save();

      return res.status(400).json({
        success: false,
        message: `Payment ${paymentData.status}`,
      });
    }

    // Validate amount (Paystack returns in kobo)
    const expectedAmountInKobo = paymentTransaction.amount * 100;
    if (paymentData.amount !== expectedAmountInKobo) {
      console.error(
        `[Payment] Amount mismatch for ${reference}. Expected: ${expectedAmountInKobo}, Got: ${paymentData.amount}`
      );
      paymentTransaction.status = "failed";
      await paymentTransaction.save();

      return res.status(400).json({
        success: false,
        message: "Payment amount mismatch",
      });
    }

    // Check if credits already granted (idempotency)
    const existingCreditTransaction = await CreditTransaction.findOne({
      paystackReference: reference,
    });

    if (existingCreditTransaction) {
      paymentTransaction.status = "success";
      paymentTransaction.verifiedAt = new Date();
      await paymentTransaction.save();

      return res.json({
        success: true,
        message: "Payment already processed",
        data: {
          credits: existingCreditTransaction.amount,
          balance: existingCreditTransaction.balanceAfter,
          status: "success",
        },
      });
    }

    // Grant credits
    const creditsToGrant = paymentTransaction.creditsGranted;
    const newBalance = await creditService.addCredits(
      userId,
      creditsToGrant,
      "purchase",
      `Purchased ${creditsToGrant} credits for ₦${paymentTransaction.amount}`,
      {
        paystackReference: reference,
        paymentAmount: paymentTransaction.amount,
      }
    );

    // Update payment transaction
    paymentTransaction.status = "success";
    paymentTransaction.verifiedAt = new Date();
    paymentTransaction.paystackData = paymentData;
    await paymentTransaction.save();

    // Send notification
    await Notification.create({
      user: userId,
      title: "Payment Successful! 💳",
      message: `You successfully purchased ${creditsToGrant} credits for ₦${
        paymentTransaction.amount
      }. New balance: ${Math.round(newBalance)} credits.`,
      type: "success",
    });

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(userId).emit("credits:updated", {
        userId,
        credits: Math.round(newBalance),
      });
    }

    console.log(
      `[Payment] Verified and credited ${creditsToGrant} credits to user ${userId} for payment ${reference}`
    );

    res.json({
      success: true,
      message: "Payment verified and credits added",
      data: {
        credits: creditsToGrant,
        balance: Math.round(newBalance),
        status: "success",
      },
    });
  } catch (error) {
    console.error("[Payment] Verify error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};

/**
 * Get credit packages
 * GET /api/payments/packages
 */
exports.getCreditPackages = async (req, res) => {
  try {
    res.json({
      success: true,
      data: CREDIT_PACKAGES,
    });
  } catch (error) {
    console.error("[Payment] Get packages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch credit packages",
    });
  }
};

/**
 * Get payment history
 * GET /api/payments/history
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const payments = await PaymentTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("-paystackData");

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("[Payment] Get history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
    });
  }
};

module.exports = exports;
