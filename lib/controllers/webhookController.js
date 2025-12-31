const PaymentTransaction = require("@/models/PaymentTransaction");
const WebhookEvent = require("@/models/WebhookEvent");
const CreditTransaction = require("@/models/CreditTransaction");
const Notification = require("@/models/Notification");
const paystackService = require("@/lib/services/paystackService");
const flutterwaveService = require("@/lib/services/flutterwaveService");
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
 * Handle Flutterwave webhook events
 * POST /api/payments/webhook?provider=flutterwave OR routed via slug
 */
exports.handleFlutterwaveWebhook = async (req, res) => {
  try {
    const signature = req.headers["verif-hash"];
    const event = req.body;

    console.log(`[Webhook:Flutterwave] Received event: ${event.event}`);

    // Validate signature
    // Note: Flutterwave verification happens via secret hash check or IP whitelist usually
    // For simplicity we use the signature header check implemented in service
    const isValid = flutterwaveService.verifySignature(req);

    // Log webhook event
    const webhookEvent = await WebhookEvent.create({
      provider: "flutterwave",
      event: event.event,
      reference: event.data?.tx_ref,
      data: event,
      signature,
      signatureValid: isValid,
      processed: false,
    });

    if (!isValid) {
      console.error("[Webhook:Flutterwave] Invalid signature");
      webhookEvent.error = "Invalid signature";
      await webhookEvent.save();
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    // Process successful charge
    if (
      event.event === "charge.completed" &&
      event.data.status === "successful"
    ) {
      try {
        await processPaymentSuccess(
          event.data.tx_ref,
          event.data.amount,
          event.data,
          "flutterwave"
        );

        webhookEvent.processed = true;
        webhookEvent.processedAt = new Date();
        await webhookEvent.save();

        console.log(
          `[Webhook:Flutterwave] Successfully processed ${event.data.tx_ref}`
        );
      } catch (error) {
        console.error("[Webhook:Flutterwave] Processing error:", error);
        webhookEvent.error = error.message;
        await webhookEvent.save();
        // Return 200 even on processing error to stop retries if it's a logic error, but 500 if transient.
        // For safety, we often return 200 if we logged "processed=false" and manually retry.
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Webhook:Flutterwave] Handler error:", error);
    res.status(500).json({ success: false });
  }
};

/**
 * Process charge.success event
 */
/**
 * Generic Process Payment Success
 */
async function processPaymentSuccess(
  reference,
  amountPaid,
  providerData,
  provider
) {
  // Find payment transaction
  const paymentTransaction = await PaymentTransaction.findOne({ reference });
  if (!paymentTransaction) {
    console.error(`[Webhook] Payment transaction not found: ${reference}`);
    throw new Error("Payment transaction not found");
  }

  // Check if already processed
  if (
    paymentTransaction.webhookProcessed ||
    paymentTransaction.status === "success"
  ) {
    console.log(`[Webhook] Payment ${reference} already processed`);
    return;
  }

  // Validate amount
  // Paystack: amount in kobo. Flutterwave: amount in units.
  // Our DB stores amount in units (e.g., 500 NGN).
  let expectedAmount = paymentTransaction.amount;
  let receivedAmount = amountPaid;

  if (provider === "paystack") {
    // Data passed from paystack webhook is in kobo, convert check to kobo
    // Or convert received to units. Let's convert expected to kobo for comparison if input is kobo.
    // Wait, processChargeSuccess call site for paystack passes `event.data`. `event.data.amount` is kobo.
    // So receivedAmount is kobo.
    if (Math.abs(receivedAmount - expectedAmount * 100) > 10) {
      // Tolerate floating point tiny diffs? Integer math preferred.
      console.error(
        `[Webhook] Amount mismatch. Expected: ${
          expectedAmount * 100
        }, Got: ${receivedAmount}`
      );
      throw new Error("Amount mismatch");
    }
  } else {
    // Flutterwave sends units (e.g 100).
    if (Math.abs(receivedAmount - expectedAmount) > 0.5) {
      // Tolerate small diffs
      console.error(
        `[Webhook] Amount mismatch. Expected: ${expectedAmount}, Got: ${receivedAmount}`
      );
      throw new Error("Amount mismatch");
    }
  }

  // Check if credits already granted (double-check idempotency via CreditTransaction)
  // We already checked paymentTransaction status, but legacy check:
  const existingCreditTransaction = await CreditTransaction.findOne({
    paystackReference: reference, // We use this field for generic reference now
  });

  if (existingCreditTransaction) {
    paymentTransaction.status = "success";
    paymentTransaction.webhookProcessed = true;
    paymentTransaction.webhookProcessedAt = new Date();
    if (provider === "paystack") paymentTransaction.paystackData = providerData;
    if (provider === "flutterwave")
      paymentTransaction.flutterwaveData = providerData;
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
    `Purchased ${creditsToGrant} credits for ${paymentTransaction.currency} ${paymentTransaction.amount} via ${provider}`,
    {
      paystackReference: reference, // Keeping field name for consistency
      paymentAmount: paymentTransaction.amount,
      provider: provider,
    }
  );

  // Update payment transaction
  paymentTransaction.status = "success";
  paymentTransaction.webhookProcessed = true;
  paymentTransaction.webhookProcessedAt = new Date();
  if (provider === "paystack") paymentTransaction.paystackData = providerData;
  if (provider === "flutterwave")
    paymentTransaction.flutterwaveData = providerData;
  await paymentTransaction.save();

  // Send notification
  await Notification.create({
    user: userId,
    title: "Payment Confirmed! 💳",
    message: `Your payment of ${paymentTransaction.currency} ${
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

// Legacy wrapper for Paystack specific call from existing handler
async function processChargeSuccess(data, webhookEvent) {
  return processPaymentSuccess(data.reference, data.amount, data, "paystack");
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
