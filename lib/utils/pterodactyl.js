const axios = require("axios");
const WebSocket = require("ws");
const dotenv = require("dotenv");
const path = require("path");
const loggerService = require("../services/loggerService");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const PTERODACTYL_DOMAIN =
  process.env.PTERODACTYL_DOMAIN || "https://panel.samkiel.dev";
const PTERODACTYL_APP_KEY =
  process.env.PTERODACTYL_APP_KEY || process.env.PTERODACTYL_API_KEY;
const PTERODACTYL_CLIENT_KEY =
  process.env.PTERODACTYL_CLIENT_KEY || process.env.PTERODACTYL_API_KEY;

const api = axios.create({
  baseURL: `${PTERODACTYL_DOMAIN}/api/application`,
  timeout: 10000,
  headers: {
    Authorization: `Bearer ${PTERODACTYL_APP_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const clientApi = axios.create({
  baseURL: `${PTERODACTYL_DOMAIN}/api/client`,
  timeout: 10000,
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
    // console.log("[Ptero] Looking for Node.js egg...");
    const nests = await api.get("/nests");
    for (const nest of nests.data.data) {
      const eggs = await api.get(`/nests/${nest.attributes.id}/eggs`);
      const nodeEgg = eggs.data.data.find(
        (e) =>
          e.attributes.name.toLowerCase().includes("node") ||
          e.attributes.docker_image.includes("node"),
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

// Header to find the Node by IP (or pick first)
/**
 * Selects the best node for a new deployment based on capacity and safety rules.
 *
 * Safety Rules:
 * - Minimum 500MB free RAM
 * - RAM usage must not exceed 80% of total node RAM
 *
 * Selection Algorithm:
 * 1. Filter eligible nodes (online, active, meets safety rules)
 * 2. Sort by highest free RAM
 * 3. Tie-break by lowest allocated RAM
 */
/**
 * Checks if Node 3 is healthy based on resource limits.
 * Requirement 2: RAM >= 80%, Disk >= 85%, CPU >= 85%
 */
const checkNodeHealth = async (nodeId = 3) => {
  try {
    const response = await api.get(`/nodes/${nodeId}`);
    const { memory, disk, allocated_resources } = response.data.attributes;

    const ramUsage = (allocated_resources.memory / memory) * 100;
    const diskUsage = (allocated_resources.disk / disk) * 100;

    // Since Application API doesn't provide real-time CPU usage, we check if it's over-allocated
    // Or we could fetch from a metrics service if available.
    // For now, we'll use 0 as a placeholder or fetch if we can.
    const cpuUsage = 0;

    return {
      ramUsage,
      diskUsage,
      cpuUsage,
      isOverloaded: ramUsage >= 80 || diskUsage >= 85 || cpuUsage >= 85,
    };
  } catch (error) {
    console.error(
      `[Ptero] Error checking health for node ${nodeId}:`,
      error.message,
    );
    throw new Error(
      "Deployment temporarily unavailable. Our servers are under maintenance.",
    );
  }
};

const findNode = async (ip, userId) => {
  // Hardcode all deployments to Node ID = 3 (Requirement 1)
  return 3;
};

const getNodes = async () => {
  try {
    // Include servers and their users
    const response = await api.get(
      "/nodes?include=allocations,servers,servers.user",
    );
    return response.data.data;
  } catch (error) {
    console.error("Error getting nodes:", error.message);
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
      disk = 500,
      memory = 300,
      cpu = 25,
      branch = "main",
    } = deploymentData;

    // Dynamic lookup
    const { nestId, eggId } = await findNodeJSEgg();
    const nodeId = await findNode(null, userId);

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
        `/nodes/${nodeId}/allocations?page=${page}`,
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
        "No free allocations (ports) available on the node after checking 5 pages.",
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
        "if [ -d .git ]; then echo 'Updating existing installation...'; if [ -f settings.js ]; then cp settings.js settings.js.bak; fi; git fetch origin main && git reset --hard origin/main; if [ -f settings.js.bak ]; then mv settings.js.bak settings.js; fi; else echo 'Fresh installation, setup...'; git init . && git remote add origin $REPO_URL && git fetch origin $BRANCH && git reset --hard origin/$BRANCH; fi; npm install; node index.js",
      environment: {
        BOT_NUMBER: botNumber,
        REPO_URL: "https://github.com/samkiell/SAMKIEL-AI",
        BRANCH: branch,
        START_CMD: "node index.js",
      },
      limits: {
        memory: memory,
        swap: 0,
        disk: disk,
        io: 300,
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
    if (error.response?.data?.errors) {
      console.error(
        "Pterodactyl Validation Errors:",
        JSON.stringify(error.response.data.errors, null, 2),
      );
    }
    console.error(
      "Create Server Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

// Get Websocket Details
const getWebsocketDetails = async (uuid) => {
  try {
    const response = await clientApi.get(`/servers/${uuid}/websocket`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Helper to strip ANSI codes
const stripAnsi = (str) =>
  str.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    "",
  );

// Monitor Console for Pairing Code and Success
const monitorDeployment = async (
  uuid,
  { onCode, onReady },
  timeoutMs = 600000,
) => {
  let ws;
  let timer;

  return new Promise(async (resolve, reject) => {
    try {
      const { token, socket } = await getWebsocketDetails(uuid);
      ws = new WebSocket(socket, {
        origin: PTERODACTYL_DOMAIN,
      });

      // Set timeout (default 10 minutes)
      timer = setTimeout(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        resolve("timeout");
      }, timeoutMs);

      ws.on("open", () => {
        ws.send(JSON.stringify({ event: "auth", args: [token] }));
      });

      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());

          // On Auth Success, request logs history
          if (msg.event === "auth success") {
            ws.send(JSON.stringify({ event: "send logs", args: [null] }));
          }

          // Check console output
          if (msg.event === "console output") {
            // Strip ANSI codes
            const logLine = stripAnsi(msg.args[0]);

            // DEBUG: Log to file
            loggerService.log("ptero-console.log", `${uuid}: ${logLine}`);

            // 1. Detect Strict Pairing Code
            // Format constraint: "Your Pairing Code : 759P-Z9VD"
            const strictPairingRegex =
              /Your Pairing Code\s*[:\s-]*\s*([A-Z0-9]{4}-[A-Z0-9]{4})/i;
            const strictMatch = logLine.match(strictPairingRegex);

            if (strictMatch && strictMatch[1]) {
              const code = strictMatch[1];
              console.log(`[Monitor] Found pairing code: ${code}`);
              loggerService.log(
                "ptero-console.log",
                `[MATCH] Found code: ${code}`,
              );

              if (onCode) onCode(code);

              // We don't close immediately here because we might want to wait for "Connected"
              // But requirements say "Stop scanning once pairing code is detected"?
              // Actually requirement turned into: "Stop further console monitoring for that server"
              // So we resolve and close.
              clearTimeout(timer);
              ws.close();
              resolve(code);
            }

            // 2. Detect Success/Connection
            const successMatch =
              /Bot Connected|Opened connection|Client ready|Success|connected successfully|successfully connected/i.test(
                logLine,
              );

            if (successMatch) {
              if (onReady) onReady();
              clearTimeout(timer);
              ws.close();
              resolve("connected");
            }
          }
        } catch (parseError) {
          // Ignore
        }
      });

      ws.on("error", (err) => {
        console.error("Pterodactyl WS Error:", err.message);
      });

      ws.on("close", () => {
        // Did we timeout or was it closed manually?
        // If closed by us (success/timeout), promise is already resolved.
        // If closed by remote, we might want to resolve or just let it be.
        resolve("closed");
      });
    } catch (error) {
      if (timer) clearTimeout(timer);
      reject(error);
    }
  });
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
    const url = `/servers/${uuid}/resources`;
    // console.log(`[Ptero] Fetching resources: ${clientApi.defaults.baseURL}${url}`);
    const response = await clientApi.get(url);
    return response.data;
  } catch (error) {
    console.error(`[Ptero] getResources error for ${uuid}:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

const suspendServer = async (serverId) => {
  try {
    await api.post(`/servers/${serverId}/suspend`);
    return true;
  } catch (error) {
    throw error;
  }
};

const unsuspendServer = async (serverId) => {
  try {
    await api.post(`/servers/${serverId}/unsuspend`);
    return true;
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

// Helper to wait for installation to complete
const waitForInstallation = async (identifier) => {
  const maxRetries = 20; // Wait up to ~100 seconds
  const delay = 5000; // 5 seconds

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await clientApi.get(`/servers/${identifier}`);
      const isInstalling = response.data.attributes.is_installing;

      if (!isInstalling) {
        return true; // Installation complete
      }

      console.log(
        `Server ${identifier} is still installing... (Attempt ${
          i + 1
        }/${maxRetries})`,
      );
    } catch (error) {
      console.error(
        `Error checking installation status for ${identifier}:`,
        error.message,
      );
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error(
    `Server ${identifier} failed to finish installing after ${
      maxRetries * delay
    }ms`,
  );
};

// Update Server Build (Resource Limits)
const updateServerBuild = async (serverId, limits) => {
  try {
    // 1. Get current server details to retrieve the required 'allocation' ID
    const serverDetails = await getServerDetails(serverId);
    const primaryAllocation = serverDetails.attributes.allocation;

    // 2. Perform the update
    // Limits: { memory, cpu, disk, swap, io }
    // Note: Application API /servers/{id}/build
    const response = await api.patch(`/servers/${serverId}/build`, {
      allocation: primaryAllocation,
      memory: limits.memory,
      cpu: limits.cpu,
      disk: limits.disk,
      swap: limits.swap || 0,
      io: limits.io || 500,
      oom_killer: true,
      feature_limits: {
        databases: 0,
        backups: 0,
        allocations: 0,
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Update Server Build Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

module.exports = {
  createServer,
  getServerDetails,
  requestPowerAction,
  deleteServer,
  suspendServer,
  unsuspendServer,
  getResources,
  sendCommand: async (uuid, command) => {
    try {
      const response = await clientApi.post(`/servers/${uuid}/command`, {
        command,
      });
      return response.data;
    } catch (error) {
      console.error(
        "Send Command Error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },
  waitForInstallation,
  monitorDeployment,
  getWebsocketDetails,
  getNodes,
  checkNodeHealth,
  updateServerBuild,
};
