const express = require("express");
const router = express.Router();
const creditsController = require("../controllers/creditsController");
const { protect } = require("../utils/authMiddleware");

// Public routes
router.get("/packages", creditsController.getCreditPackages);
router.get("/pricing", creditsController.getResourcePricing);

// Protected routes
router.get("/balance", protect, creditsController.getCreditBalance);
router.get("/history", protect, creditsController.getCreditHistory);
router.post("/calculate", protect, creditsController.calculateCost);

// DEPRECATED: Use /api/payments/init instead
router.post(
  "/purchase/initialize",
  protect,
  creditsController.initializePurchase
);

// DEPRECATED: Use /api/payments/verify instead
router.get(
  "/purchase/verify/:reference",
  protect,
  creditsController.verifyPurchase
);

router.get("/referral/stats", protect, creditsController.getReferralStats);
router.post("/referral/apply", protect, creditsController.applyReferral);

module.exports = router;
