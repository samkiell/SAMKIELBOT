const { successResponse, errorResponse } = require("../../../../../lib/utils/response");
const emailBroadcastService = require("../../../../../lib/services/emailBroadcastService");
const { protect, admin } = require("../../../../../lib/utils/authMiddleware");
const dbConnect = require("../../../../../lib/dbConnect");

export default async function handler(req, res) {
  try {
    // 1. Ensure DB Connection
    await dbConnect();

    // 2. Wrap in Auth Middleware
    return await protect(req, res, async () => {
      return await admin(req, res, async () => {
        if (req.method !== "GET") {
          return errorResponse(res, "Method not allowed", 405);
        }

        const { id } = req.query;
        if (!id) return errorResponse(res, "Broadcast ID required", 400);

        const stats = await emailBroadcastService.getBroadcastStats(id);
        return successResponse(res, stats, "Broadcast stats fetched");
      });
    });
  } catch (error) {
    console.error(`[API] Broadcast Stats Error:`, error);
    return errorResponse(res, error.message, 500);
  }
}
