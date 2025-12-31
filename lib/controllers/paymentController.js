const User = require("@/models/User");
const PaymentTransaction = require("@/models/PaymentTransaction");
const PaymentQuote = require("@/models/PaymentQuote");
const CreditTransaction = require("@/models/CreditTransaction");
const Notification = require("@/models/Notification");
const geoService = require("@/lib/services/geoService");
const exchangeRateService = require("@/lib/services/exchangeRateService");
const paystackService = require("@/lib/services/paystackService");
const creditService = require("@/lib/services/creditService");
const crypto = require("crypto");

const CREDIT_PACKAGES = [
  { id: 1, credits: 50, priceInNgn: 500, popular: false },
  { id: 2, credits: 120, priceInNgn: 1000, popular: true },
  { id: 3, credits: 260, priceInNgn: 2000, popular: false },
  { id: 4, credits: 700, priceInNgn: 5000, popular: false },
];

const PAYSTACK_SUPPORTED_CURRENCIES = ["NGN", "USD", "GHS", "ZAR", "KES"];

/**
 * Get client IP from request headers or connection
 */
const getClientIp = (req) => {
  return req.headers["x-forwarded-for"] || req.connection.remoteAddress;
};

/**
 * Map detected currency to a supported Paystack currency
 */
const getSupportedCurrency = (detectedCurrency) => {
  const currency = detectedCurrency.toUpperCase();
  if (PAYSTACK_SUPPORTED_CURRENCIES.includes(currency)) {
    return currency;
  }
  return "USD"; // Default fallback for international users
};

/**
 * Initialize payment for credit purchase
 * POST /api/payments/init
 */
exports.initializePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // --- QUOTE BASED FLOW ---
    if (req.body.quoteId) {
      const { quoteId } = req.body;
      const quote = await PaymentQuote.findById(quoteId);

      if (!quote) {
        return res
          .status(404)
          .json({ success: false, message: "Quote not found" });
      }

      if (quote.expiresAt < Date.now()) {
        return res
          .status(400)
          .json({ success: false, message: "Quote expired" });
      }

      if (quote.user.toString() !== userId) {
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized quote" });
      }

      // Generate unique reference
      const reference = `PAY_${Date.now()}_${crypto
        .randomBytes(4)
        .toString("hex")
        .toUpperCase()}`;

      // Create transaction from quote
      const paymentTransaction = await PaymentTransaction.create({
        user: userId,
        reference,
        amount: quote.totalAmount, // Charge the total (with tax)
        currency: quote.processingCurrency,
        creditsGranted: quote.items[0].credits, // Assuming single item for now
        status: "pending",
        provider: "paystack",
        metadata: {
          packageId: quote.items[0].packageId,
          quoteId: quote._id,
          username: user.username,
          email: user.email,
          basePriceInNgn: quote.subtotalNgn,
          exchangeRate: quote.exchangeRate,
          taxAmount: quote.taxAmount,
        },
      });

      // Initialize Paystack
      const paymentResult = await paystackService.initializePayment({
        email: user.email,
        amount: quote.totalAmount,
        currency: quote.processingCurrency,
        reference,
        metadata: {
          userId: user._id.toString(),
          username: user.username,
          creditsToGrant: quote.items[0].credits,
          packageId: quote.items[0].packageId,
          type: "credit_purchase",
          currency: quote.processingCurrency,
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

      // Mark quote as used (optional, or wait for success)
      quote.isUsed = true;
      await quote.save();

      return res.json({
        success: true,
        data: {
          authorization_url: paymentResult.data.authorization_url,
          reference: paymentResult.data.reference,
          credits: quote.items[0].credits,
          amount: quote.totalAmount,
          currency: quote.processingCurrency,
        },
      });
    }

    // --- LEGACY/DIRECT FLOW ---
    const { packageId } = req.body;

    // Validate package ID
    const selectedPackage = CREDIT_PACKAGES.find((pkg) => pkg.id == packageId);

    // Geolocation and Currency Resolution
    const userIp = getClientIp(req);
    const rawCurrency = await geoService.getCurrencyByIp(userIp);
    const currency = getSupportedCurrency(rawCurrency);

    // Convert price to target currency
    const convertedPrice = await exchangeRateService.convertFromNgn(
      selectedPackage.priceInNgn,
      currency
    );

    // Generate unique reference
    const reference = `PAY_${Date.now()}_${crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;

    // Create pending payment transaction
    const paymentTransaction = await PaymentTransaction.create({
      user: userId,
      reference,
      amount: convertedPrice,
      currency: currency,
      creditsGranted: selectedPackage.credits,
      status: "pending",
      provider: "paystack",
      metadata: {
        packageId: selectedPackage.id,
        username: user.username,
        email: user.email,
        basePriceInNgn: selectedPackage.priceInNgn,
        originalDetectedCurrency: rawCurrency,
      },
    });

    // Initialize payment with Paystack
    const paymentResult = await paystackService.initializePayment({
      email: user.email,
      amount: convertedPrice,
      currency: currency,
      reference,
      metadata: {
        userId: user._id.toString(),
        username: user.username,
        creditsToGrant: selectedPackage.credits,
        packageId: selectedPackage.id,
        type: "credit_purchase",
        currency,
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
      `[Payment] Initialized ${currency} payment ${reference} for user ${user.username}`
    );

    res.json({
      success: true,
      data: {
        authorization_url: paymentResult.data.authorization_url,
        reference: paymentResult.data.reference,
        credits: selectedPackage.credits,
        amount: convertedPrice,
        currency: currency,
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
      `Purchased ${creditsToGrant} credits for ${
        paymentTransaction.currency
      } ${paymentTransaction.amount.toFixed(2)}`,
      {
        paystackReference: reference,
        paymentAmount: paymentTransaction.amount,
        currency: paymentTransaction.currency,
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
      message: `You successfully purchased ${creditsToGrant} credits for ${
        paymentTransaction.currency
      } ${paymentTransaction.amount.toFixed(2)}. New balance: ${Math.round(
        newBalance
      )} credits.`,
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
    const userIp = getClientIp(req);
    const rawCurrency = await geoService.getCurrencyByIp(userIp);
    const currency = getSupportedCurrency(rawCurrency);

    // Map packages with converted prices
    const localizedPackages = await Promise.all(
      CREDIT_PACKAGES.map(async (pkg) => {
        const convertedPrice = await exchangeRateService.convertFromNgn(
          pkg.priceInNgn,
          currency
        );

        return {
          ...pkg,
          price: convertedPrice,
          currency: currency,
        };
      })
    );

    res.json({
      success: true,
      data: localizedPackages,
      meta: {
        currency,
        detectedLocalCurrency: rawCurrency,
        isSupported: rawCurrency === currency,
      },
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

/**
 * Create a payment quote
 * POST /api/payments/quote
 */
exports.createQuote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { packageId, currency } = req.body;

    // Validate Inputs
    // Use loose equality to support string IDs from frontend
    const pkg = CREDIT_PACKAGES.find((p) => p.id == packageId);
    if (!pkg) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid package" });
    }

    // Determine target currency (Supported by Paystack or fallback to USD)
    const processingCurrency = getSupportedCurrency(currency || "NGN");

    // Get Rate
    const rates = await exchangeRateService.getExchangeRates();
    // Calculate rate relative to NGN
    const rate = rates[processingCurrency] || rates["USD"];

    // Calculate Amounts
    const basePriceNgn = pkg.priceInNgn;
    const convertedSubtotal = basePriceNgn * rate;

    // Tax (8.5%)
    const taxRate = 0.085;
    const taxAmount = convertedSubtotal * taxRate;
    const totalAmount = convertedSubtotal + taxAmount;

    // Create Quote
    const quote = await PaymentQuote.create({
      user: userId,
      items: [
        {
          packageId: pkg.id,
          basePriceNgn: basePriceNgn,
          credits: pkg.credits,
        },
      ],
      selectedCurrency: currency, // User's preference
      processingCurrency: processingCurrency, // Actual charge currency
      exchangeRate: rate,
      subtotalNgn: basePriceNgn,
      subtotalConverted: parseFloat(convertedSubtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    });

    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error("[Payment] Create quote error:", error);
    res.status(500).json({ success: false, message: "Failed to create quote" });
  }
};

module.exports = exports;
