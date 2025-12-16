const dbConnect = require("../../lib/dbConnect");
const {
  deployBot,
  getDeployments,
  updateDeployment,
  createDeployment,
  deleteDeployment,
  controlServer,
} = require("../../lib/controllers/deployController");
const {
  getDeploymentStatus,
  getActiveBots,
} = require("../../lib/controllers/deploymentStatusController");
const { protect } = require("../../lib/utils/authMiddleware");
const Deployment = require("../../models/Deployment");

export default async function handler(req, res) {
  const { method } = req;
  const { slug } = req.query;

  try {
    // Ensure database connection
    await dbConnect();
    // Route: POST /api/deploy
    if (!slug && method === "POST") {
      return await protect(req, res, async () => {
        return await deployBot(req, res);
      });
    }

    // Route: GET /api/deploy
    if (!slug && method === "GET") {
      return await protect(req, res, async () => {
        return await getDeployments(req, res);
      });
    }

    // Route: POST /api/deploy/create
    if (slug && slug[0] === "create" && method === "POST") {
      return await protect(req, res, async () => {
        return await createDeployment(req, res);
      });
    }

    // Route: GET /api/deploy/active
    if (slug && slug[0] === "active" && method === "GET") {
      return await protect(req, res, async () => {
        return await getActiveBots(req, res);
      });
    }

    // Route: GET /api/deploy/:id/status
    if (slug && slug.length === 2 && slug[1] === "status" && method === "GET") {
      req.params = { id: slug[0] };
      return await protect(req, res, async () => {
        return await getDeploymentStatus(req, res);
      });
    }

    // Route: POST /api/deploy/:id/power
    if (slug && slug.length === 2 && slug[1] === "power" && method === "POST") {
      req.params = { id: slug[0] };
      return await protect(req, res, async () => {
        return await controlServer(req, res);
      });
    }

    // Route: GET /api/deploy/:id
    if (slug && slug.length === 1 && method === "GET") {
      return await protect(req, res, async () => {
        const deployment = await Deployment.findById(slug[0]);

        if (!deployment) {
          return res
            .status(404)
            .json({ success: false, error: "Deployment not found" });
        }

        // Check if user owns the deployment
        if (deployment.user.toString() !== req.user.id) {
          return res
            .status(401)
            .json({ success: false, error: "Not authorized" });
        }

        return res.status(200).json({
          success: true,
          data: deployment,
        });
      });
    }

    // Route: PUT /api/deploy/:id
    if (slug && slug.length === 1 && method === "PUT") {
      req.params = { id: slug[0] };
      return await protect(req, res, async () => {
        return await updateDeployment(req, res);
      });
    }

    // Route: DELETE /api/deploy/:id
    if (slug && slug.length === 1 && method === "DELETE") {
      req.params = { id: slug[0] };
      return await protect(req, res, async () => {
        return await deleteDeployment(req, res);
      });
    }

    // Method not allowed
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  } catch (error) {
    console.error("Deploy API Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
}
