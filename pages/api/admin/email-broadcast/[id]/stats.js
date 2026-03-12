const { successResponse, errorResponse } = require("../../../../../lib/utils/response");
const emailBroadcastService = require("../../../../../lib/services/emailBroadcastService");
const { verifyAdmin } = require("../../../../../lib/auth");

export default async function handler(req, res) {
  try {
    // 1. Authenticate
    const user = await verifyAdmin(req);
    if (!user) return errorResponse(res, "Unauthorized", 401);

    if (req.method !== "GET") {
      return errorResponse(res, "Method not allowed", 405);
    }

    const { id } = req.query;
    if (!id) return errorResponse(res, "Broadcast ID required", 400);

    const stats = await emailBroadcastService.getBroadcastStats(id);

    return successResponse(res, stats, "Broadcast stats fetched");
  } catch (error) {
    console.error(`[API] Broadcast Stats Error:`, error);
    return errorResponse(res, error.message, 500);
  }
}
