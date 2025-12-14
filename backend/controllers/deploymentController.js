const BotServer = require("../models/BotServer");
const pterodactyl = require("../utils/pterodactyl");

// Deploy a new bot
exports.deployBot = async (req, res) => {
  try {
    const { botNumber, botName, user } = req.body; // user might be passed or from auth middleware

    // Basic validation
    if (!botNumber || !botName) {
      return res
        .status(400)
        .json({ error: "Bot Name and Number are required" });
    }

    // Logic to get the actual User ID from DB if needed
    // For now using provided or default logic
    // If there's an authenticated user (req.user), use that ID for MongoDB reference
    const userId = req.user ? req.user._id : user || "000000000000000000000000"; // Fallback dummy ID

    // 1. Create Server on Pterodactyl
    const serverData = await pterodactyl.createServer({
      botName,
      botNumber,
      userId,
    });

    // 2. Save Metadata to MongoDB
    const botServer = new BotServer({
      user: userId,
      botName,
      botNumber,
      pterodactylId: serverData.pterodactylId,
      pterodactylUuid: serverData.pterodactylUuid, // Use UUID for Client API
      identifier: serverData.identifier,
      nodeId: serverData.nodeId,
      eggId: serverData.eggId,
      status: "installing",
    });

    await botServer.save();

    res.status(201).json({
      message: "Bot deployment started successfully",
      server: botServer,
    });
  } catch (error) {
    console.error("Deployment Error:", error);
    res
      .status(500)
      .json({ error: "Failed to deploy bot", details: error.message });
  }
};

// Get Status
exports.getDeploymentStatus = async (req, res) => {
  try {
    // Find by MongoDB ID
    const serverId = req.params.id;
    const botServer = await BotServer.findById(serverId);

    if (!botServer) {
      return res.status(404).json({ error: "Server not found" });
    }

    // Get live stats from Pterodactyl
    try {
      const stats = await pterodactyl.getResources(botServer.identifier);
      // Update local status if possible
      botServer.status = stats.attributes.current_state;
      await botServer.save();

      res.json({
        dbStatus: botServer.status,
        liveStats: stats.attributes,
      });
    } catch (pteroError) {
      // E.g. server installing
      res.json({
        dbStatus: botServer.status,
        liveStats: null,
        message: "Stats unavailable (installing or offline)",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Power Actions
exports.controlServer = async (req, res) => {
  const { action } = req.body; // start, stop, restart, kill
  const serverId = req.params.id;

  try {
    const botServer = await BotServer.findById(serverId);
    if (!botServer) return res.status(404).json({ error: "Server not found" });

    await pterodactyl.requestPowerAction(botServer.identifier, action);

    res.json({
      message: `Signal ${action} sent to server.`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Control action failed", details: error.message });
  }
};

// Delete Server
exports.deleteBot = async (req, res) => {
  const serverId = req.params.id;
  try {
    const botServer = await BotServer.findById(serverId);
    if (!botServer) return res.status(404).json({ error: "Server not found" });

    // Delete from Pterodactyl
    await pterodactyl.deleteServer(botServer.pterodactylId);

    // Delete from DB
    await BotServer.findByIdAndDelete(serverId);

    res.json({ message: "Server deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed", details: error.message });
  }
};
