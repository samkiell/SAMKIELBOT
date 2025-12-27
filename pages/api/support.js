import dbConnect from "@/lib/dbConnect";
import { createTicket } from "@/lib/controllers/supportController";
import { protect } from "@/lib/utils/authMiddleware";

export default async function handler(req, res) {
  const { method } = req;

  try {
    await dbConnect();

    if (method === "POST") {
      return await protect(req, res, async () => {
        return await createTicket(req, res);
      });
    }

    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error("Support API Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
    });
  }
}
