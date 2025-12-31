const mongoose = require("mongoose");

const paymentQuoteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [
      {
        packageId: { type: String, required: true },
        basePriceNgn: { type: Number, required: true },
        credits: { type: Number, required: true },
      },
    ],
    selectedCurrency: {
      type: String, // e.g., "USD", "EUR"
      required: true,
    },
    processingCurrency: {
      type: String, // e.g., "USD", "NGN" (What Paystack sees)
      required: true,
    },
    exchangeRate: {
      type: Number,
      required: true,
    },
    subtotalNgn: {
      type: Number,
      required: true,
    },
    subtotalConverted: {
      type: Number,
      required: true,
    },
    taxAmount: {
      type: Number,
      required: true, // 8.5%
    },
    totalAmount: {
      type: Number, // subtotalConverted + taxAmount
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.PaymentQuote ||
  mongoose.model("PaymentQuote", paymentQuoteSchema);
