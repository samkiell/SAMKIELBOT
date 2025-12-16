const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billingController");
const { protect } = require("../utils/authMiddleware");

// Public routes
router.get("/plans", billingController.getPlans);

// Webhook (no auth required, validated by signature)
router.post("/webhook/paystack", billingController.paystackWebhook);

// Protected routes
router.get(
  "/subscription/status",
  protect,
  billingController.getSubscriptionStatus
);
router.post(
  "/subscription/initialize",
  protect,
  billingController.initializePayment
);
router.get(
  "/subscription/verify/:reference",
  protect,
  billingController.verifyPayment
);
router.post(
  "/subscription/cancel",
  protect,
  billingController.cancelSubscription
);
router.get(
  "/subscription/history",
  protect,
  billingController.getSubscriptionHistory
);

module.exports = router;
