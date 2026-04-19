import dbConnect from "../../../lib/dbConnect";
import { processNextBatch } from "../../../lib/services/broadcastWorker";
const { protect, admin } = require("../../../lib/utils/authMiddleware");

export default async function handler(req, res) {
  // Use admin protection for browser-based triggers
  return await protect(req, res, async (req, res) => {
    return await admin(req, res, async (req, res) => {
      try {
        await dbConnect();
        
        console.log("[Admin Trigger] Starting broadcast batch processing...");
        const result = await processNextBatch(25);
        
        return res.status(200).json({
          success: true,
          message: "Batch processed successfully",
          ...result
        });
      } catch (error) {
        console.error("[Admin Trigger] Broadcast processing failed:", error);
        return res.status(500).json({
          success: false,
          message: "Processing failed",
          error: error.message
        });
      }
    });
  });
}

