import paymentController from "@/lib/controllers/paymentController";
import webhookController from "@/lib/controllers/webhookController";
const { protect, admin } = require("../../lib/utils/authMiddleware");

export default async function handler(req, res) {
  const { method } = req;
  const { slug } = req.query;

  try {
    // Route: GET /api/payments/packages
    if (slug && slug[0] === "packages" && method === "GET") {
      return await paymentController.getCreditPackages(req, res);
    }

    // Route: POST /api/payments/webhook (no auth, validated by signature)
    if (slug && slug[0] === "webhook" && !slug[1] && method === "POST") {
      return await webhookController.handlePaystackWebhook(req, res);
    }

    // Route: GET /api/payments/webhook/logs (admin only)
    if (
      slug &&
      slug[0] === "webhook" &&
      slug[1] === "logs" &&
      method === "GET"
    ) {
      return await protect(req, res, async () => {
        return await admin(req, res, async () => {
          return await webhookController.getWebhookLogs(req, res);
        });
      });
    }

    // Route: POST /api/payments/init
    if (slug && slug[0] === "init" && method === "POST") {
      return await protect(req, res, async () => {
        return await paymentController.initializePayment(req, res);
      });
    }

    // Route: GET /api/payments/verify
    if (slug && slug[0] === "verify" && method === "GET") {
      return await protect(req, res, async () => {
        return await paymentController.verifyPayment(req, res);
      });
    }

    // Route: GET /api/payments/history
    if (slug && slug[0] === "history" && method === "GET") {
      return await protect(req, res, async () => {
        return await paymentController.getPaymentHistory(req, res);
      });
    }

    // Method not allowed
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error("Payments API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
