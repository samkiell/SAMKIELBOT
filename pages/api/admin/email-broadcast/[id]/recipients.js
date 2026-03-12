const { successResponse, errorResponse } = require("../../../../../lib/utils/response");
const emailBroadcastService = require("../../../../../lib/services/emailBroadcastService");
const { verifyAdmin } = require("../../../../../lib/auth");

export default async function handler(req, res) {
  try {
    // 1. Authenticate
    const user = await verifyAdmin(req);
    if (!user) return errorResponse(res, "Unauthorized", 401);

    if (req.method === "GET") {
      const { id, page, limit, status, search } = req.query;
      if (!id) return errorResponse(res, "Broadcast ID required", 400);

      const result = await emailBroadcastService.getBroadcastRecipients(id, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status,
        search
      });

      return successResponse(res, result, "Recipients fetched");
    } 

    if (req.method === "POST") {
      const { recipientId } = req.body;
      if (!recipientId) return errorResponse(res, "Recipient ID required", 400);

      const result = await emailBroadcastService.manualRecipientAction(recipientId);
      return successResponse(res, result, "Manual action successful");
    }

    return errorResponse(res, "Method not allowed", 405);
  } catch (error) {
    console.error(`[API] Broadcast Recipients Error:`, error);
    return errorResponse(res, error.message, 500);
  }
}
