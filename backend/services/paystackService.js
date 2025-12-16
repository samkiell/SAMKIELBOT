const axios = require("axios");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

if (!PAYSTACK_SECRET_KEY) {
  console.warn(
    "⚠️  PAYSTACK_SECRET_KEY not set. Billing features will not work."
  );
}

const paystackAxios = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

/**
 * Initialize a payment transaction
 * @param {Object} params - Payment parameters
 * @param {string} params.email - Customer email
 * @param {number} params.amount - Amount in kobo (multiply by 100)
 * @param {string} params.reference - Unique transaction reference
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<Object>} - Paystack response
 */
async function initializePayment({ email, amount, reference, metadata = {} }) {
  try {
    const response = await paystackAxios.post("/transaction/initialize", {
      email,
      amount: amount * 100, // Convert to kobo
      reference,
      metadata,
      callback_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
    });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("[Paystack] Initialize payment error:", error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || "Payment initialization failed",
    };
  }
}

/**
 * Verify a payment transaction
 * @param {string} reference - Transaction reference
 * @returns {Promise<Object>} - Verification result
 */
async function verifyPayment(reference) {
  try {
    const response = await paystackAxios.get(
      `/transaction/verify/${reference}`
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("[Paystack] Verify payment error:", error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || "Payment verification failed",
    };
  }
}

/**
 * Create a customer on Paystack
 * @param {Object} params - Customer parameters
 * @param {string} params.email - Customer email
 * @param {string} params.first_name - First name
 * @param {string} params.last_name - Last name
 * @param {string} params.phone - Phone number
 * @returns {Promise<Object>} - Customer creation result
 */
async function createCustomer({ email, first_name, last_name, phone }) {
  try {
    const response = await paystackAxios.post("/customer", {
      email,
      first_name,
      last_name,
      phone,
    });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("[Paystack] Create customer error:", error.response?.data);
    return {
      success: false,
      error: error.response?.data?.message || "Customer creation failed",
    };
  }
}

/**
 * Validate Paystack webhook signature
 * @param {string} signature - X-Paystack-Signature header
 * @param {Object} body - Request body
 * @returns {boolean} - Whether signature is valid
 */
function validateWebhookSignature(signature, body) {
  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(body))
    .digest("hex");

  return hash === signature;
}

module.exports = {
  initializePayment,
  verifyPayment,
  createCustomer,
  validateWebhookSignature,
};
