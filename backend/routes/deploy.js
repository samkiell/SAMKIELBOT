const express = require("express");
const {
  deployBot,
  getDeployments,
  updateDeployment,
  createDeployment,
  deleteDeployment,
  controlServer, // Import this
} = require("../controllers/deployController");
const { protect } = require("../utils/authMiddleware");

const router = express.Router();

router.route("/").post(protect, deployBot).get(protect, getDeployments);
router.route("/create").post(protect, createDeployment);
router
  .route("/:id")
  .put(protect, updateDeployment)
  .delete(protect, deleteDeployment); // Previous chain end

router.route("/:id/power").post(protect, controlServer); // Power control route

router.route("/:id").get(protect, async (req, res) => {
  try {
    const Deployment = require("../models/Deployment");
    const deployment = await Deployment.findById(req.params.id);

    if (!deployment) {
      return res
        .status(404)
        .json({ success: false, error: "Deployment not found" });
    }

    // Check if user owns the deploymentt
    if (deployment.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: "Not authorized" });
    }

    res.status(200).json({
      success: true,
      data: deployment,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
