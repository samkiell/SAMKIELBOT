import dbConnect from "@/lib/dbConnect";
import {
  getNotifications,
  markRead,
  deleteNotification,
  createSuggestion,
  getBotsList,
} from "@/lib/controllers/interactionsController";
import { protect } from "@/lib/utils/authMiddleware";

export default async function handler(req, res) {
  const { method } = req;
  const { slug } = req.query;

  try {
    // Ensure database connection
    await dbConnect();
    // Route: GET /api/notifications
    if (slug && slug[0] === "notifications" && !slug[1] && method === "GET") {
      return await protect(req, res, async () => {
        return await getNotifications(req, res);
      });
    }

    // Route: PUT /api/notifications/read
    if (
      slug &&
      slug[0] === "notifications" &&
      slug[1] === "read" &&
      method === "PUT"
    ) {
      return await protect(req, res, async () => {
        return await markRead(req, res);
      });
    }

    // Route: DELETE /api/notifications/:id
    if (
      slug &&
      slug[0] === "notifications" &&
      slug[1] &&
      slug[1] !== "read" &&
      method === "DELETE"
    ) {
      // Inject ID into query if not already present (though req.query.slug has it, deleteNotification expects req.query.id or we can set it)
      req.query.id = slug[1];
      return await protect(req, res, async () => {
        return await deleteNotification(req, res);
      });
    }

    // Route: POST /api/suggestions
    if (slug && slug[0] === "suggestions" && method === "POST") {
      return await protect(req, res, async () => {
        return await createSuggestion(req, res);
      });
    }

    // Route: GET /api/bots-list (public)
    if (slug && slug[0] === "bots-list" && method === "GET") {
      return await getBotsList(req, res);
    }

    // Method not allowed
    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error("Interactions API Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
}
