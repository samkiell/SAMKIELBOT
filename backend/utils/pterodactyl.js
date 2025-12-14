const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const PTERODACTYL_DOMAIN =
  process.env.PTERODACTYL_DOMAIN || "https://panel.samkiel.dev";
const PTERODACTYL_APP_KEY =
  process.env.PTERODACTYL_APP_KEY || process.env.PTERODACTYL_API_KEY;
const PTERODACTYL_CLIENT_KEY =
  process.env.PTERODACTYL_CLIENT_KEY || process.env.PTERODACTYL_API_KEY;

const api = axios.create({
  baseURL: `${PTERODACTYL_DOMAIN}/api/application`,
  headers: {
    Authorization: `Bearer ${PTERODACTYL_APP_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const clientApi = axios.create({
  baseURL: `${PTERODACTYL_DOMAIN}/api/client`,
  headers: {
    Authorization: `Bearer ${PTERODACTYL_CLIENT_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Helper to find the Node.js Egg
const findNodeJSEgg = async () => {
  // If IDs are provided in .env, use them to skip the API lookup (avoids needing 'Read Nests' permission)
  if (process.env.PTERODACTYL_NEST_ID && process.env.PTERODACTYL_EGG_ID) {
    return {
      nestId: parseInt(process.env.PTERODACTYL_NEST_ID),
      eggId: parseInt(process.env.PTERODACTYL_EGG_ID),
    };
  }

  try {
    const nests = await api.get("/nests");
    for (const nest of nests.data.data) {
      const eggs = await api.get(`/nests/${nest.attributes.id}/eggs`);
      const nodeEgg = eggs.data.data.find(
        (e) =>
          e.attributes.name.toLowerCase().includes("node") ||
          e.attributes.docker_image.includes("node")
      );
      if (nodeEgg) {
        return { nestId: nest.attributes.id, eggId: nodeEgg.attributes.id };
      }
    }
    throw new Error("Node.js Egg not found");
  } catch (error) {
    console.error("Error finding Node.js Egg:", error.message);
    throw error;
  }
};

// Helper to find the Node by IP (or pick first)
const findNode = async (ip) => {
  if (process.env.PTERODACTYL_NODE_ID) {
    return parseInt(process.env.PTERODACTYL_NODE_ID);
  }

  try {
    const nodes = await api.get("/nodes");
    // If IP provided, try to match, else return first
    if (ip) {
      // This is a naive check; normally you'd check allocations, but Pterodactyl API structure varies.
      // We'll just look for a node that has this IP in its allocations or maintenance settings?
      // Actually allocations are separate.
      // Let's just return the first active node for simplicity as requested.
      // Or try to find one with the IP.
      // For now, return the first one.
      if (nodes.data.data.length > 0) return nodes.data.data[0].attributes.id;
    }
    if (nodes.data.data.length > 0) return nodes.data.data[0].attributes.id;
    throw new Error("No nodes found");
  } catch (error) {
    console.error("Error finding Node:", error.message);
    throw error;
  }
};

// Create Server
const createServer = async (deploymentData) => {
  try {
    const {
      botName,
      botNumber,
      userId,
      disk = 1024,
      memory = 500,
      cpu = 25,
      branch = "main",
    } = deploymentData;

    // Dynamic lookup
    const { nestId, eggId } = await findNodeJSEgg();
    const nodeId = await findNode("167.172.109.70");

    // Allocation: We need to find an unallocated port.
    // Pterodactyl Application API 'create server' usually handles allocation if we pass allocation_id,
    // or we can let it auto-assign if we don't specify?
    // Actually, we usually need to specify `allocation` (integer ID) or `allocation: { default: ... }`.
    // Let's simplified: we assume we can just ask for any allocation on the node.

    // We'll need to fetch allocations for the node and pick a free one?
    // OR safer: rely on Pterodactyl to assign? Pterodactyl API requires `allocation.default` to be an ID.
    // We must fetch allocations first.

    // Fetch allocations on the node and find a free one
    // Note: The API does not allow filtering by 'assigned' status directly.
    // We will fetch allocations and look for one where assigned is false.
    let defaultAllocation = null;
    let page = 1;

    while (!defaultAllocation && page <= 5) {
      // Check first 5 pages max to avoid infinite loop
      const allocationsResponse = await api.get(
        `/nodes/${nodeId}/allocations?page=${page}`
      );
      const allocationList = allocationsResponse.data.data;

      if (allocationList.length === 0) break;

      const freeAllocation = allocationList.find((a) => !a.attributes.assigned);
      if (freeAllocation) {
        defaultAllocation = freeAllocation.attributes.id;
      } else {
        page++;
      }
    }

    if (!defaultAllocation) {
      throw new Error(
        "No free allocations (ports) available on the node after checking 5 pages."
      );
    }

    const payload = {
      name: botName,
      user: 1, // HARDCODED: Users usually need a Pterodactyl User ID.
      // IMPORTANT: Does the requesting user correspond to a Pterodactyl User?
      // If 'bot deployment platform', maybe all bots run under one Admin user (ID 1)?
      // The requirement says "create a server... saves server info".
      // If we want users to *manage* it via the SAMKIEL dashboard, we (the default admin) can control it.
      // I will assume ID 1 (Admin) owns the server, and the custom Dashboard controls it via API using Admin Key.
      // Creating real Pterodactyl users for every web-user is complex (needs email, etc).
      nest: nestId,
      egg: eggId,
      docker_image: "ghcr.io/parkervcp/yolks:nodejs_22", // Default common image
      startup:
        "if [ -f /home/container/package.json ]; then npm install; fi; echo \"module.exports = { botNumber: '{{BOT_NUMBER}}' }\" > settings.js; node index.js",
      environment: {
        BOT_NUMBER: botNumber,
        REPO_URL: "https://github.com/samkiell/SAMKIEL-AI",
        BRANCH: branch,
        START_CMD: "npm install && node index.js",
      },
      limits: {
        memory: memory,
        swap: 0,
        disk: disk,
        io: 500,
        cpu: cpu,
      },
      feature_limits: {
        databases: 0,
        backups: 0,
        allocations: 0,
      },
      allocation: {
        default: defaultAllocation,
      },
    };

    const response = await api.post("/servers", payload);
    return {
      pterodactylId: response.data.attributes.id,
      pterodactylUuid: response.data.attributes.uuid,
      identifier: response.data.attributes.identifier,
      nodeId: nodeId,
      eggId: eggId,
    };
  } catch (error) {
    console.error(
      "Create Server Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const getServerDetails = async (serverId) => {
  try {
    const response = await api.get(`/servers/${serverId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const requestPowerAction = async (uuid, signal) => {
  try {
    // Client API Uses UUID usually (short identifier or UUID)
    // Signal: start, stop, restart, kill
    const response = await clientApi.post(`/servers/${uuid}/power`, { signal });
    return response.data;
  } catch (error) {
    console.error("Power Action Error:", error.response?.data || error.message);
    throw error;
  }
};

const getResources = async (uuid) => {
  try {
    const response = await clientApi.get(`/servers/${uuid}/resources`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const deleteServer = async (serverId) => {
  try {
    await api.delete(`/servers/${serverId}`);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createServer,
  getServerDetails,
  requestPowerAction,
  deleteServer,
  getResources,
};
