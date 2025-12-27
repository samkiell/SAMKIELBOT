const axios = require("axios");

// In-memory cache for IP to Geo mapping
const geoCache = new Map();
const CACHE_TTL = 3600 * 1000 * 24; // 24 hours

/**
 * Get currency for a given IP address
 * @param {string} ip - IP address
 * @returns {Promise<string>} - Currency code (ISO 4217)
 */
async function getCurrencyByIp(ip) {
  // Return default if IP is localhost or missing
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1") {
    return "NGN"; // Default for development
  }

  // Check cache
  if (geoCache.has(ip)) {
    const cached = geoCache.get(ip);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.currency;
    }
  }

  try {
    // Using ip-api.com (free for non-commercial)
    const response = await axios.get(
      `http://ip-api.com/json/${ip}?fields=status,message,countryCode,currency`
    );

    if (response.data.status === "success") {
      const currency = response.data.currency || "USD";

      // Update cache
      geoCache.set(ip, {
        currency,
        timestamp: Date.now(),
      });

      return currency;
    }

    console.warn(
      `[GeoService] Geolocation failed for IP ${ip}: ${response.data.message}`
    );
    return "NGN"; // Fallback
  } catch (error) {
    console.error(
      `[GeoService] Error fetching geo data for IP ${ip}:`,
      error.message
    );
    return "NGN"; // Fallback
  }
}

module.exports = {
  getCurrencyByIp,
};
