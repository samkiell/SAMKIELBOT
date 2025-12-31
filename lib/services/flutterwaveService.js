const axios = require("axios");

const FLW_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLW_ENC_KEY = process.env.FLUTTERWAVE_ENCRYPTION_KEY;

if (!FLW_SECRET_KEY) {
  console.warn("Flutterwave Secret Key is missing in environment variables.");
}

/**
 * Initialize a Standard Payment
 * docs: https://developer.flutterwave.com/docs/integration/guides/payments/standard/
 */
exports.initializePayment = async (data) => {
  try {
    const { amount, currency, email, reference, metadata, redirect_url } = data;

    const payload = {
      tx_ref: reference,
      amount: amount,
      currency: currency,
      redirect_url:
        redirect_url ||
        `${
          process.env.NEXT_PUBLIC_APP_URL || "https://samkielbot.app"
        }/checkout/verify?provider=flutterwave`,
      customer: {
        email: email,
        name: metadata.username || "SAMKIELBOT User",
      },
      meta: metadata,
      customizations: {
        title: "SAMKIEL BOT Credits",
        logo: "https://samkielbot.app/favicon.ico",
      },
    };

    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      payload,
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status === "success") {
      return {
        success: true,
        data: {
          authorization_url: response.data.data.link,
          reference: reference, // Flutterwave uses tx_ref
        },
      };
    } else {
      return {
        success: false,
        error: response.data.message || "Flutterwave initialization failed",
      };
    }
  } catch (error) {
    console.error(
      "Flutterwave Init Error:",
      error.response ? error.response.data : error.message
    );
    return {
      success: false,
      error: error.response?.data?.message || "Payment initialization error",
    };
  }
};

/**
 * Verify a Transaction
 */
exports.verifyPayment = async (transactionId) => {
  try {
    // transactionId can be the transaction ID returned by FW or the tx_ref.
    // Ideally, for verification endpoint, we often use the unique ID or iterate via tx_ref if using get transactions.
    // Standard FW verify endpoint uses ID.

    // NOTE: On redirection, FW appends ?status=successful&tx_ref=xyz&transaction_id=123
    // We should prefer verifying by ID if available.

    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status === "success") {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: "Verification failed at gateway",
      };
    }
  } catch (error) {
    console.error(
      "Flutterwave Verify Error:",
      error.response ? error.response.data : error.message
    );
    return {
      success: false,
      error: error.response?.data?.message || "Verification error",
    };
  }
};

/**
 * Verify Webhook Signature
 */
exports.verifySignature = (req) => {
  const signature = req.headers["verif-hash"];
  if (!signature) return false;

  // If you configured a secret hash in dashboard, verify it matches
  const secretHash =
    process.env.FLUTTERWAVE_WEBHOOK_HASH || "samkiel_secret_hash";
  return signature === secretHash;
};

module.exports = exports;
