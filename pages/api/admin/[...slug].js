const { protect, admin } = require("../../lib/utils/authMiddleware";
const {
  getSystemStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllBots,
  controlBot,
  suspendBot,
  deleteBot,
  syncNodes,
  getNodes,
  getAuditLogs,
  getUserDetails,
  getUserBots,
  getSuggestions,
  updateSuggestion,
  sendNotification,
  getServerConsole,
  getNode,
  syncServerStats,
  addCreditsToUser,
  getUserCredits,
  forceSyncBotStatuses,
  getFeatureFlags,
  updateFeatureFlag,
} = require("../../lib/controllers/adminController";

export default async function handler(req, res) {
  const { method } = req;
  const { slug } = req.query;

  try {
    // Apply admin middleware
    return await protect(req, res, async () => {
      return await admin(req, res, async () => {
        // Route: GET /api/admin/dashboard
        if (slug && slug[0] === "dashboard" && method === "GET") {
          return await getSystemStats(req, res);
        }

        // Route: GET /api/admin/users
        if (slug && slug[0] === "users" && !slug[1] && method === "GET") {
          return await getAllUsers(req, res);
        }

        // Route: GET /api/admin/users/:id
        if (
          slug &&
          slug[0] === "users" &&
          slug[1] &&
          !slug[2] &&
          method === "GET"
        ) {
          req.params = { id: slug[1] };
          return await getUserDetails(req, res);
        }

        // Route: PUT /api/admin/users/:id
        if (
          slug &&
          slug[0] === "users" &&
          slug[1] &&
          !slug[2] &&
          method === "PUT"
        ) {
          req.params = { id: slug[1] };
          return await updateUser(req, res);
        }

        // Route: DELETE /api/admin/users/:id
        if (
          slug &&
          slug[0] === "users" &&
          slug[1] &&
          !slug[2] &&
          method === "DELETE"
        ) {
          req.params = { id: slug[1] };
          return await deleteUser(req, res);
        }

        // Route: GET /api/admin/users/:id/bots
        if (
          slug &&
          slug[0] === "users" &&
          slug[1] &&
          slug[2] === "bots" &&
          method === "GET"
        ) {
          req.params = { id: slug[1] };
          return await getUserBots(req, res);
        }

        // Route: GET /api/admin/users/:id/credits
        if (
          slug &&
          slug[0] === "users" &&
          slug[1] &&
          slug[2] === "credits" &&
          method === "GET"
        ) {
          req.params = { id: slug[1] };
          return await getUserCredits(req, res);
        }

        // Route: POST /api/admin/users/:id/credits
        if (
          slug &&
          slug[0] === "users" &&
          slug[1] &&
          slug[2] === "credits" &&
          method === "POST"
        ) {
          req.params = { id: slug[1] };
          return await addCreditsToUser(req, res);
        }

        // Route: GET /api/admin/bots
        if (slug && slug[0] === "bots" && !slug[1] && method === "GET") {
          return await getAllBots(req, res);
        }

        // Route: POST /api/admin/bots/sync-stats
        if (
          slug &&
          slug[0] === "bots" &&
          slug[1] === "sync-stats" &&
          method === "POST"
        ) {
          return await syncServerStats(req, res);
        }

        // Route: POST /api/admin/bots/sync-status
        if (
          slug &&
          slug[0] === "bots" &&
          slug[1] === "sync-status" &&
          method === "POST"
        ) {
          return await forceSyncBotStatuses(req, res);
        }

        // Route: POST /api/admin/bots/:id/power
        if (
          slug &&
          slug[0] === "bots" &&
          slug[1] &&
          slug[2] === "power" &&
          method === "POST"
        ) {
          req.params = { id: slug[1] };
          return await controlBot(req, res);
        }

        // Route: POST /api/admin/bots/:id/suspend
        if (
          slug &&
          slug[0] === "bots" &&
          slug[1] &&
          slug[2] === "suspend" &&
          method === "POST"
        ) {
          req.params = { id: slug[1] };
          return await suspendBot(req, res);
        }

        // Route: DELETE /api/admin/bots/:id
        if (
          slug &&
          slug[0] === "bots" &&
          slug[1] &&
          !slug[2] &&
          method === "DELETE"
        ) {
          req.params = { id: slug[1] };
          return await deleteBot(req, res);
        }

        // Route: GET /api/admin/server/:id/console
        if (
          slug &&
          slug[0] === "server" &&
          slug[1] &&
          slug[2] === "console" &&
          method === "GET"
        ) {
          req.params = { id: slug[1] };
          return await getServerConsole(req, res);
        }

        // Route: GET /api/admin/nodes
        if (slug && slug[0] === "nodes" && !slug[1] && method === "GET") {
          return await getNodes(req, res);
        }

        // Route: GET /api/admin/nodes/:id
        if (
          slug &&
          slug[0] === "nodes" &&
          slug[1] &&
          !slug[2] &&
          method === "GET"
        ) {
          req.params = { id: slug[1] };
          return await getNode(req, res);
        }

        // Route: POST /api/admin/nodes/sync
        if (
          slug &&
          slug[0] === "nodes" &&
          slug[1] === "sync" &&
          method === "POST"
        ) {
          return await syncNodes(req, res);
        }

        // Route: GET /api/admin/audit-logs
        if (slug && slug[0] === "audit-logs" && method === "GET") {
          return await getAuditLogs(req, res);
        }

        // Route: GET /api/admin/suggestions
        if (slug && slug[0] === "suggestions" && !slug[1] && method === "GET") {
          return await getSuggestions(req, res);
        }

        // Route: PUT /api/admin/suggestions/:id
        if (slug && slug[0] === "suggestions" && slug[1] && method === "PUT") {
          req.params = { id: slug[1] };
          return await updateSuggestion(req, res);
        }

        // Route: POST /api/admin/notifications
        if (slug && slug[0] === "notifications" && method === "POST") {
          return await sendNotification(req, res);
        }

        // Route: GET /api/admin/settings/flags
        if (
          slug &&
          slug[0] === "settings" &&
          slug[1] === "flags" &&
          !slug[2] &&
          method === "GET"
        ) {
          return await getFeatureFlags(req, res);
        }

        // Route: PUT /api/admin/settings/flags/:key
        if (
          slug &&
          slug[0] === "settings" &&
          slug[1] === "flags" &&
          slug[2] &&
          method === "PUT"
        ) {
          req.params = { key: slug[2] };
          return await updateFeatureFlag(req, res);
        }

        // Method not allowed
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
      });
    });
  } catch (error) {
    console.error("Admin API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
