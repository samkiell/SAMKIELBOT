const axios = require("axios");
const WebSocket = require("ws");
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
        "if [ ! -f /home/container/package.json ]; then echo 'SAMKIEL AI couldnt find any files on the panel, cloning...'; git clone -b $BRANCH $REPO_URL .; fi; npm install; echo \"Checking settings.js from repo...\"; cat settings.js; node index.js",
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
    ""
  );

// Monitor Console for Pairing Code and Success
const monitorDeployment = async (
  uuid,
  { onCode, onReady },
  timeoutMs = 600000
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
            const fs = require("fs");
            const path = require("path");
            const logDir = path.join(__dirname, "../../logs");
            if (!fs.existsSync(logDir))
              fs.mkdirSync(logDir, { recursive: true });
            fs.appendFileSync(
              path.join(logDir, "ptero-console.log"),
              `[${new Date().toISOString()}] ${uuid}: ${logLine}\n`
            );

            // 1. Detect Strict Pairing Code
            // Format constraint: "Your Pairing Code : 759P-Z9VD"
            const strictPairingRegex =
              /Your Pairing Code\s*:\s*([A-Z0-9]{4}-[A-Z0-9]{4})/;
            const strictMatch = logLine.match(strictPairingRegex);

            if (strictMatch && strictMatch[1]) {
              const code = strictMatch[1];
              console.log(`[Monitor] Found pairing code: ${code}`);
              fs.appendFileSync(
                path.join(logDir, "ptero-console.log"),
                `[MATCH] Found code: ${code}\n`
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
                logLine
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
    const response = await clientApi.get(`/servers/${uuid}/resources`);
    return response.data;
  } catch (error) {
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
        }/${maxRetries})`
      );
    } catch (error) {
      console.error(
        `Error checking installation status for ${identifier}:`,
        error.message
      );
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error(
    `Server ${identifier} failed to finish installing after ${
      maxRetries * delay
    }ms`
  );
};

module.exports = {
  createServer,
  getServerDetails,
  requestPowerAction,
  deleteServer,
  suspendServer,
  unsuspendServer,
  getResources,
  waitForInstallation,
  monitorDeployment,
  getWebsocketDetails,
};
