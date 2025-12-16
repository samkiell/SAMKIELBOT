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
router.post(
  "/purchase/initialize",
  protect,
  creditsController.initializePurchase
);
router.get(
  "/purchase/verify/:reference",
  protect,
  creditsController.verifyPurchase
);
router.post("/referral/apply", protect, creditsController.applyReferral);

module.exports = router;
