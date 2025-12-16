const {
  register,
  login,
  verifyToken,
  updateProfile,
  validateReferrer,
} = require("../../lib/controllers/authController"");
const { protect } = require("../../lib/utils/authMiddleware"");

export default async function handler(req, res) {
  const { method } = req;
  const { slug } = req.query;

  try {
    // Route: POST /api/auth/register
    if (slug && slug[0] === "register" && method === "POST") {
      return await register(req, res);
    }

    // Route: POST /api/auth/login
    if (slug && slug[0] === "login" && method === "POST") {
      return await login(req, res);
    }

    // Route: GET /api/auth/verify
    if (slug && slug[0] === "verify" && method === "GET") {
      return await protect(req, res, async () => {
        return await verifyToken(req, res);
      });
    }

    // Route: PUT /api/auth/profile
    if (slug && slug[0] === "profile" && method === "PUT") {
      return await protect(req, res, async () => {
        return await updateProfile(req, res);
      });
    }

    // Route: GET /api/auth/validate-referrer/:username
    if (
      slug &&
      slug[0] === "validate-referrer" &&
      slug[1] &&
      method === "GET"
    ) {
      req.params = { username: slug[1] };
      return await validateReferrer(req, res);
    }

    // Method not allowed
    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error("Auth API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
