const axios = require("axios");

// In-memory cache for exchange rates
let rateCache = {
  rates: {},
  timestamp: 0,
};
const CACHE_TTL = 3600 * 1000 * 12; // 12 hours

// Base currency is NGN as per current implementation
const BASE_CURRENCY = "NGN";

/**
 * Fetch latest exchange rates with caching
 * @returns {Promise<Object>} - Exchange rates mapping (Base: NGN)
 */
async function getExchangeRates() {
  const now = Date.now();

  if (rateCache.rates && now - rateCache.timestamp < CACHE_TTL) {
    return rateCache.rates;
  }

  try {
    // Using exchangerate-api.com (free tier)
    // If no API key is provided, we use a fallback or a default mapping for common currencies
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;

    if (apiKey) {
      const response = await axios.get(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${BASE_CURRENCY}`
      );
      if (response.data && response.data.result === "success") {
        rateCache = {
          rates: response.data.conversion_rates,
          timestamp: now,
        };
        return rateCache.rates;
      }
    }

    // Fallback static rates if API fails or no key
    // These are approximate and should be updated via API key in production
    const fallbackRates = {
      NGN: 1,
      USD: 0.00062, // 1 NGN = 0.00062 USD (approx)
      GHS: 0.0085,
      ZAR: 0.012,
      KES: 0.082,
      GBP: 0.00049,
      EUR: 0.00057,
    };

    console.warn("[ExchangeRateService] Using fallback exchange rates");
    return fallbackRates;
  } catch (error) {
    console.error(
      "[ExchangeRateService] Error fetching exchange rates:",
      error.message
    );
    return rateCache.rates || { NGN: 1 }; // Return cached or minimal fallback
  }
}

/**
 * Convert an amount from NGN to target currency
 * @param {number} amountInNgn - Amount in Naira
 * @param {string} targetCurrency - Target currency code
 * @returns {Promise<number>} - Converted amount
 */
async function convertFromNgn(amountInNgn, targetCurrency) {
  if (targetCurrency === BASE_CURRENCY) return amountInNgn;

  const rates = await getExchangeRates();
  const rate = rates[targetCurrency];

  if (!rate) {
    console.warn(
      `[ExchangeRateService] Rate not found for ${targetCurrency}, falling back to USD`
    );
    const usdRate = rates["USD"] || 0.001;
    return amountInNgn * usdRate;
  }

  return amountInNgn * rate;
}

module.exports = {
  getExchangeRates,
  convertFromNgn,
};
