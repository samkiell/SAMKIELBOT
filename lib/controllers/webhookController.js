const PaymentTransaction = require("@/models/PaymentTransaction");
const WebhookEvent = require("@/models/WebhookEvent");
const CreditTransaction = require("@/models/CreditTransaction");
const Notification = require("@/models/Notification");
const paystackService = require("@/lib/services/paystackService");
const creditService = require("@/lib/services/creditService");

/**
 * Handle Paystack webhook events
 * POST /api/paystack/webhook
 */
exports.handlePaystackWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"];
    const event = req.body;

    console.log(`[Webhook] Received event: ${event.event}`);

    // Validate signature
    const isValid = paystackService.validateWebhookSignature(signature, event);

    // Log webhook event
    const webhookEvent = await WebhookEvent.create({
      provider: "paystack",
      event: event.event,
      reference: event.data?.reference,
      data: event,
      signature,
      signatureValid: isValid,
      processed: false,
    });

    if (!isValid) {
      console.error("[Webhook] Invalid signature");
      webhookEvent.error = "Invalid signature";
      await webhookEvent.save();

      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // Process charge.success event
    if (event.event === "charge.success") {
      try {
        await processChargeSuccess(event.data, webhookEvent);

        webhookEvent.processed = true;
        webhookEvent.processedAt = new Date();
        await webhookEvent.save();

        console.log(`[Webhook] Successfully processed ${event.data.reference}`);
      } catch (error) {
        console.error("[Webhook] Processing error:", error);
        webhookEvent.error = error.message;
        await webhookEvent.save();

        return res.status(500).json({
          success: false,
          message: "Webhook processing failed",
        });
      }
    } else {
      // Log other events but don't process
      webhookEvent.processed = true;
      webhookEvent.processedAt = new Date();
      await webhookEvent.save();
      console.log(`[Webhook] Event ${event.event} logged but not processed`);
    }

    // Always return 200 to Paystack
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Webhook] Handler error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook handler error",
    });
  }
};

/**
 * Process charge.success event
 */
async function processChargeSuccess(data, webhookEvent) {
  const reference = data.reference;

  // Find payment transaction
  const paymentTransaction = await PaymentTransaction.findOne({ reference });
  if (!paymentTransaction) {
    console.error(`[Webhook] Payment transaction not found: ${reference}`);
    throw new Error("Payment transaction not found");
  }

  // Check if already processed by webhook (idempotency)
  if (paymentTransaction.webhookProcessed) {
    console.log(`[Webhook] Payment ${reference} already processed by webhook`);
    return;
  }

  // Validate status
  if (data.status !== "success") {
    console.log(
      `[Webhook] Payment ${reference} status is ${data.status}, not processing`
    );
    paymentTransaction.status =
      data.status === "failed" ? "failed" : "abandoned";
    paymentTransaction.paystackData = data;
    await paymentTransaction.save();
    return;
  }

  // Validate amount
  const expectedAmountInKobo = paymentTransaction.amount * 100;
  if (data.amount !== expectedAmountInKobo) {
    console.error(
      `[Webhook] Amount mismatch for ${reference}. Expected: ${expectedAmountInKobo}, Got: ${data.amount}`
    );
    throw new Error("Amount mismatch");
  }

  // Check if credits already granted (double-check idempotency)
  const existingCreditTransaction = await CreditTransaction.findOne({
    paystackReference: reference,
  });

  if (existingCreditTransaction) {
    console.log(`[Webhook] Credits already granted for ${reference}`);
    paymentTransaction.status = "success";
    paymentTransaction.webhookProcessed = true;
    paymentTransaction.webhookProcessedAt = new Date();
    paymentTransaction.paystackData = data;
    await paymentTransaction.save();
    return;
  }

  // Grant credits
  const userId = paymentTransaction.user;
  const creditsToGrant = paymentTransaction.creditsGranted;

  const newBalance = await creditService.addCredits(
    userId,
    creditsToGrant,
    "purchase",
    `Purchased ${creditsToGrant} credits for ₦${paymentTransaction.amount} (Webhook)`,
    {
      paystackReference: reference,
      paymentAmount: paymentTransaction.amount,
    }
  );

  // Update payment transaction
  paymentTransaction.status = "success";
  paymentTransaction.webhookProcessed = true;
  paymentTransaction.webhookProcessedAt = new Date();
  paymentTransaction.paystackData = data;
  await paymentTransaction.save();

  // Send notification
  await Notification.create({
    user: userId,
    title: "Payment Confirmed! 💳",
    message: `Your payment of ₦${
      paymentTransaction.amount
    } has been confirmed. ${creditsToGrant} credits added. New balance: ${Math.round(
      newBalance
    )} credits.`,
    type: "success",
  });

  console.log(
    `[Webhook] Credited ${creditsToGrant} credits to user ${userId} for payment ${reference}`
  );
}

/**
 * Get webhook logs (Admin only)
 * GET /api/paystack/webhook/logs
 */
exports.getWebhookLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await WebhookEvent.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("-data.authorization");

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("[Webhook] Get logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch webhook logs",
    });
  }
};

module.exports = exports;
