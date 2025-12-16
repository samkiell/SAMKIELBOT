import creditsController from "@/lib/controllers/creditsController";
const { protect } = require("../../lib/utils/authMiddleware";

export default async function handler(req, res) {
  const { method } = req;
  const { slug } = req.query;

  try {
    // Route: GET /api/credits/packages
    if (slug && slug[0] === "packages" && method === "GET") {
      return await creditsController.getCreditPackages(req, res);
    }

    // Route: GET /api/credits/pricing
    if (slug && slug[0] === "pricing" && method === "GET") {
      return await creditsController.getResourcePricing(req, res);
    }

    // Route: GET /api/credits/balance
    if (slug && slug[0] === "balance" && method === "GET") {
      return await protect(req, res, async () => {
        return await creditsController.getCreditBalance(req, res);
      });
    }

    // Route: GET /api/credits/history
    if (slug && slug[0] === "history" && method === "GET") {
      return await protect(req, res, async () => {
        return await creditsController.getCreditHistory(req, res);
      });
    }

    // Route: POST /api/credits/calculate
    if (slug && slug[0] === "calculate" && method === "POST") {
      return await protect(req, res, async () => {
        return await creditsController.calculateCost(req, res);
      });
    }

    // Route: POST /api/credits/purchase/initialize (DEPRECATED)
    if (
      slug &&
      slug[0] === "purchase" &&
      slug[1] === "initialize" &&
      method === "POST"
    ) {
      return await protect(req, res, async () => {
        return await creditsController.initializePurchase(req, res);
      });
    }

    // Route: GET /api/credits/purchase/verify/:reference (DEPRECATED)
    if (
      slug &&
      slug[0] === "purchase" &&
      slug[1] === "verify" &&
      slug[2] &&
      method === "GET"
    ) {
      req.params = { reference: slug[2] };
      return await protect(req, res, async () => {
        return await creditsController.verifyPurchase(req, res);
      });
    }

    // Route: GET /api/credits/referral/stats
    if (
      slug &&
      slug[0] === "referral" &&
      slug[1] === "stats" &&
      method === "GET"
    ) {
      return await protect(req, res, async () => {
        return await creditsController.getReferralStats(req, res);
      });
    }

    // Route: POST /api/credits/referral/apply
    if (
      slug &&
      slug[0] === "referral" &&
      slug[1] === "apply" &&
      method === "POST"
    ) {
      return await protect(req, res, async () => {
        return await creditsController.applyReferral(req, res);
      });
    }

    // Method not allowed
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error("Credits API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
