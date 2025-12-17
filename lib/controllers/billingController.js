const Plan = require("@/models/Plan");
const Subscription = require("@/models/Subscription");
const User = require("@/models/User");
const paystackService = require("../services/paystackService");
const billingService = require("../services/billingService");
const crypto = require("crypto");

/**
 * Get all available plans
 */
exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1 });

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("[Billing] Get plans error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch plans",
    });
  }
};

/**
 * Get user's subscription status and limits
 */
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate("currentPlan");
    const limits = await billingService.getUserLimits(userId);

    // Get active subscription
    const subscription = await Subscription.findOne({
      user: userId,
      status: "active",
    })
      .populate("plan")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        accountType: user.accountType,
        subscriptionStatus: user.subscriptionStatus,
        expiresAt: user.subscriptionExpiresAt,
        currentPlan: user.currentPlan,
        limits,
        subscription,
      },
    });
  } catch (error) {
    console.error("[Billing] Get subscription status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription status",
    });
  }
};

/**
 * Initialize payment for a plan
 */
exports.initializePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.body;

    const user = await User.findById(userId);
    const plan = await Plan.findById(planId);

    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: "Plan not found or inactive",
      });
    }

    // Generate unique reference
    const reference = `SUB_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    // Initialize payment with Paystack
    const paymentResult = await paystackService.initializePayment({
      email: user.email,
      amount: plan.price,
      reference,
      metadata: {
        userId: user._id.toString(),
        planId: plan._id.toString(),
        planName: plan.name,
        username: user.username,
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
        accessCode: paymentResult.data.access_code,
      },
    });
  } catch (error) {
    console.error("[Billing] Initialize payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize payment",
    });
  }
};

/**
 * Verify payment
 */
exports.verifyPayment = async (req, res) => {
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

    // Check if payment was successful
    if (paymentData.status !== "success") {
      return res.status(400).json({
        success: false,
        message: "Payment was not successful",
      });
    }

    // Check if already processed
    const existingSubscription = await Subscription.findOne({
      paystackReference: reference,
    });

    if (existingSubscription) {
      return res.json({
        success: true,
        message: "Payment already processed",
        data: existingSubscription,
      });
    }

    // Extract metadata
    const planId = paymentData.metadata.planId;

    // Upgrade user to premium
    const result = await billingService.upgradeUserToPremium(userId, planId, {
      reference,
      customerCode: paymentData.customer?.customer_code,
      amount: paymentData.amount / 100, // Convert from kobo
    });

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.emit("subscription:activated", {
        userId,
        planId,
      });
    }

    res.json({
      success: true,
      message: "Payment verified and subscription activated",
      data: result.subscription,
    });
  } catch (error) {
    console.error("[Billing] Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};

/**
 * Paystack webhook handler
 */
exports.paystackWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"];
    const body = req.body;

    // Validate signature
    if (!paystackService.validateWebhookSignature(signature, body)) {
      console.error("[Billing] Invalid webhook signature");
      return res.status(400).send("Invalid signature");
    }

    const event = body.event;
    const data = body.data;

    console.log(`[Billing] Webhook received: ${event}`);

    switch (event) {
      case "charge.success":
        await handleSuccessfulCharge(data);
        break;

      case "subscription.disable":
      case "subscription.not_renew":
        await handleSubscriptionCancellation(data);
        break;

      default:
        console.log(`[Billing] Unhandled webhook event: ${event}`);
    }

    res.status(200).send("Webhook processed");
  } catch (error) {
    console.error("[Billing] Webhook error:", error);
    res.status(500).send("Webhook processing failed");
  }
};

/**
 * Handle successful charge from webhook
 */
async function handleSuccessfulCharge(data) {
  const reference = data.reference;
  const subscription = await Subscription.findOne({
    paystackReference: reference,
  });

  if (subscription) {
    // Add to payment history
    subscription.paymentHistory.push({
      reference,
      amount: data.amount / 100,
      status: "success",
      paidAt: new Date(),
    });
    await subscription.save();
  }
}

/**
 * Handle subscription cancellation from webhook
 */
async function handleSubscriptionCancellation(data) {
  const subscriptionCode = data.subscription_code;
  const subscription = await Subscription.findOne({
    paystackSubscriptionCode: subscriptionCode,
  });

  if (subscription) {
    subscription.status = "cancelled";
    subscription.cancelledAt = new Date();
    subscription.autoRenew = false;
    await subscription.save();

    // Downgrade user
    await billingService.downgradeUserToFree(
      subscription.user,
      "subscription_cancelled"
    );
  }
}

/**
 * Cancel subscription
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      user: userId,
      status: "active",
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    subscription.status = "cancelled";
    subscription.cancelledAt = new Date();
    subscription.autoRenew = false;
    await subscription.save();

    // Downgrade user
    await billingService.downgradeUserToFree(userId, "user_cancelled");

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
    });
  } catch (error) {
    console.error("[Billing] Cancel subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
    });
  }
};

/**
 * Get subscription history
 */
exports.getSubscriptionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptions = await Subscription.find({ user: userId })
      .populate("plan")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error("[Billing] Get subscription history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription history",
    });
  }
};
