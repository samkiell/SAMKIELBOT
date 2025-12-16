const dbConnect = require("../../lib/dbConnect");
const {
  updateBot,
  getUpdateHistory,
} = require("../../lib/controllers/updateController");
const { protect } = require("../../lib/utils/authMiddleware");

export default async function handler(req, res) {
  const { method } = req;
  const { slug } = req.query;

  try {
    // Ensure database connection
    await dbConnect();
    // Route: POST /api/update
    if (!slug && method === "POST") {
      return await protect(req, res, async () => {
        return await updateBot(req, res);
      });
    }

    // Route: GET /api/update/:deploymentId
    if (slug && slug.length === 1 && method === "GET") {
      req.params = { deploymentId: slug[0] };
      return await protect(req, res, async () => {
        return await getUpdateHistory(req, res);
      });
    }

    // Method not allowed
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error("Update API Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
}
