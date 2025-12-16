const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const webhookController = require("../controllers/webhookController");
const { protect, admin } = require("../utils/authMiddleware");

// Public routes
router.get("/packages", paymentController.getCreditPackages);

// Webhook (no auth, validated by signature)
router.post("/webhook", webhookController.handlePaystackWebhook);

// Protected routes
router.post("/init", protect, paymentController.initializePayment);
router.get("/verify", protect, paymentController.verifyPayment);
router.get("/history", protect, paymentController.getPaymentHistory);

// Admin routes
router.get("/webhook/logs", protect, admin, webhookController.getWebhookLogs);

module.exports = router;
