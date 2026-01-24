const Deployment = require("../../models/Deployment");
const User = require("../../models/User"); // Ensure User is imported
const Notification = require("../../models/Notification"); // Moved to top-level
const creditService = require("../services/creditService"); // Moved to top-level
const { successResponse, errorResponse } = require("../utils/response");
const axios = require("axios");
const { Octokit } = require("@octokit/rest");
const pterodactyl = require("../utils/pterodactyl");
const botHealthService = require("../services/botHealthService");
const Subscription = require("../../models/Subscription");
const Plan = require("../../models/Plan"); // Added for Tier Gating
const infraOrchestrator = require("../services/infraOrchestrator");
const AuditLog = require("../../models/AuditLog");
const { logUserAction, logAdminAction } = require("../utils/auditLogger");

// @desc    Deploy a bot manually
// @route   POST /api/deploy
// @access  Private
const deployBot = async (req, res) => {
  try {
    const { botName, version } = req.body;

    const deployment = await Deployment.create({
      user: req.user.id,
      botName,
      version,
      status: "running",
    });

    successResponse(res, deployment, 201);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// ... (rest of file)

// @desc    Create and deploy a bot with custom WhatsApp number
// @route   POST /api/deploy/create
// @access  Private

// @desc    Get all user deployments
// @route   GET /api/deploy
// @access  Private
const getDeployments = async (req, res) => {
  try {
    // Sort by createdAt descending (newest first)
    const deployments = await Deployment.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    successResponse(res, deployments);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Delete a bot deployment
// @route   DELETE /api/deploy/:id
// @access  Private
const deleteDeployment = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);

    if (!deployment) {
      return errorResponse(res, "Deployment not found", 404);
    }

    if (deployment.user.toString() !== req.user.id) {
      return errorResponse(res, "Not authorized", 401);
    }

    // Attempt to delete from Pterodactyl if ID exists
    if (deployment.pterodactylId) {
      try {
        await pterodactyl.deleteServer(deployment.pterodactylId);
      } catch (pteroError) {
        console.error(
          "Failed to delete Pterodactyl server:",
          pteroError.message,
        );
        // We continue to delete from DB even if Pterodactyl fails (orphaned record cleanup)
      }
    }

    await deployment.deleteOne();

    // Audit Log with proper actor attribution (Fix: Issue #3)
    await logUserAction(
      req,
      "delete_deployment",
      {
        type: "Deployment",
        id: deployment._id,
        name: deployment.botName,
      },
      {
        identifier: deployment.identifier,
      },
    );

    // ✅ Delete GitHub branch if it exists
    if (deployment.botNumber && process.env.GITHUB_TOKEN) {
      try {
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const owner = "samkiell";
        const repo = "SAMKIEL-AI";
        const branchName = `bot-${deployment.botNumber}`;

        console.log(
          `[Git] Deleting branch ${branchName} for deployment ${deployment._id}`,
        );
        await octokit.git.deleteRef({
          owner,
          repo,
          ref: `heads/${branchName}`,
        });
      } catch (gitError) {
        // If branch is already deleted (404) or other error, we log and continue
        if (gitError.status !== 404) {
          console.error(`[Git] Failed to delete branch: ${gitError.message}`);
        }
      }
    }

    await deployment.deleteOne();

    successResponse(res, { message: "Deployment removed" });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Update deployment info
// @route   PUT /api/deploy/:id
// @access  Private
const updateDeployment = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);

    if (!deployment) {
      return errorResponse(res, "Deployment not found", 404);
    }

    if (deployment.user.toString() !== req.user.id) {
      return errorResponse(res, "Not authorized", 401);
    }

    const updatedDeployment = await Deployment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    successResponse(res, updatedDeployment);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @desc    Create and deploy a bot with custom WhatsApp number
// @route   POST /api/deploy/create
// @access  Private
const createDeployment = async (req, res) => {
  try {
    const {
      botNumber,
      botName,
      cpu,
      ram,
      disk,
      // New Config Fields
      prefix = ".",
      ownerName,
      ownerNumber, // New Optional Field
      packName = "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",
      featureToggles = {},
    } = req.body;

    // 🛑 SYSTEM LOAD CHECK
    const infraState = await infraOrchestrator.getLiveState();
    if (infraState && infraState.host && infraState.host.memory) {
      const { usedPercent } = infraState.host.memory;
      if (usedPercent >= 85) {
        return errorResponse(
          res,
          "System Maintenance: High Load. New deployments are temporarily paused to ensure stability.",
          503,
        );
      }
    }

    // Validation
    if (!botNumber || !botName) {
      return errorResponse(
        res,
        "Bot name and WhatsApp number are required",
        400,
      );
    }

    if (!/^\d{10,15}$/.test(botNumber)) {
      return errorResponse(
        res,
        "Invalid WhatsApp number format. Please enter a valid number (10-15 digits)",
        400,
      );
    }

    // Owner Number Logic: Use provided OR fallback to User Profile
    let finalOwnerNumber = ownerNumber;
    if (!finalOwnerNumber) {
      const userProfile = await User.findById(req.user.id);
      finalOwnerNumber = userProfile.whatsappNumber;
    }

    if (!finalOwnerNumber || !/^\d{10,15}$/.test(finalOwnerNumber)) {
      return errorResponse(
        res,
        "A valid Owner Number is required (either provided or linked to your account).",
        400,
      );
    }

    // --- ALL FEATURES ACCESSIBLE TO EVERYONE ---
    const cleanFeatures = { ...featureToggles };
    const finalPackName = packName || "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";
    const finalPrefix = /^[!#./\\,?$+*%\-]$/.test(prefix) ? prefix : ".";
    // ------------------------------------------

    // ✅ CREDIT ENFORCEMENT: Calculate deployment cost
    // creditService is imported at top level

    // Validate resource selections
    const validCpu = [25, 30, 40, 50];
    const validRam = [300, 500, 1024, 2048];
    const validDisk = [500, 1024, 2048];

    const selectedCpu = validCpu.includes(cpu) ? cpu : 25;
    const selectedRam = validRam.includes(ram) ? ram : 300;
    const selectedDisk = validDisk.includes(disk) ? disk : 500;

    const costBreakdown = creditService.calculateDeploymentCost(
      selectedCpu,
      selectedRam,
      selectedDisk,
    );
    const dailyBurn = creditService.calculateDailyBurn(
      selectedCpu,
      selectedRam,
    );

    // Check if user has sufficient credits
    const hasSufficientCredits = await creditService.hasSufficientCredits(
      req.user.id,
      costBreakdown.totalCost,
    );

    if (!hasSufficientCredits) {
      const user = await User.findById(req.user.id);
      return errorResponse(
        res,
        `Insufficient credits! You have ${Math.round(
          user.credits,
        )} credits but need ${
          costBreakdown.totalCost
        } credits to deploy this bot. Please purchase more credits to continue.`,
        403,
      );
    }

    // Create deployment
    const deployment = await Deployment.create({
      user: req.user.id,
      botNumber,
      botName,
      status: "creating",
      resources: {
        ramLimit: selectedRam,
        cpuLimit: selectedCpu,
        diskLimit: selectedDisk,
      },
      // Save Config Snapshot
      configuration: {
        prefix: finalPrefix,
        ownerName: ownerName || req.user.username,
        ownerNumber: finalOwnerNumber, // Save determined number
        packName: finalPackName,
        featureToggles: new Map(Object.entries(cleanFeatures)),
      },
      creationCost: costBreakdown.creationCost,
      resourceCost: costBreakdown.resourceCost,
      totalCost: costBreakdown.totalCost,
      dailyBurn,
    });

    // Deduct credits (admins now also pay)
    await creditService.deductCredits(
      req.user.id,
      costBreakdown.totalCost,
      "bot_creation",
      `Created bot: ${botName}`,
      { deployment: deployment._id },
    );

    // Send notification
    const user = await User.findById(req.user.id);
    await Notification.create({
      user: req.user.id,
      title: "Bot Creation Started 🚀",
      message: `Your bot "${botName}" is being created. ${
        costBreakdown.totalCost
      } credits deducted. Remaining: ${Math.round(user.credits)} credits.`,
      type: "info",
    });

    // Begin deployment process asynchronously
    processDeployment(deployment._id);

    // Audit Log with proper actor attribution (Fix: Issue #3)
    await logUserAction(
      req,
      "create_deployment",
      {
        type: "Deployment",
        id: deployment._id,
        name: botName,
      },
      {
        cost: costBreakdown.totalCost,
      },
    );

    successResponse(res, deployment, 201);
  } catch (error) {
    console.error("[Deploy] Create deployment error:", error);

    // Specific error messages based on error type
    if (error.code === 11000) {
      return errorResponse(
        res,
        "A bot with this WhatsApp number already exists",
        409,
      );
    }

    if (error.name === "ValidationError") {
      return errorResponse(res, `Validation error: ${error.message}`, 400);
    }

    // Generic server error
    errorResponse(
      res,
      "Failed to create bot deployment. Please try again or contact support if the issue persists.",
      500,
    );
  }
};

// @desc    Control server power state
// @route   POST /api/deploy/:id/power
// @access  Private
const controlServer = async (req, res) => {
  try {
    const { signal } = req.body; // start, stop, restart, kill
    const deployment = await Deployment.findById(req.params.id);

    if (!deployment) {
      return errorResponse(res, "Deployment not found", 404);
    }

    if (
      deployment.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return errorResponse(res, "Not authorized", 401);
    }

    if (!["start", "stop", "restart", "kill"].includes(signal)) {
      return errorResponse(res, "Invalid signal", 400);
    }

    // Send signal to Pterodactyl
    await pterodactyl.requestPowerAction(deployment.identifier, signal);

    // Update status locally
    let newStatus = deployment.status;
    if (signal === "start") newStatus = "starting";
    if (signal === "stop" || signal === "kill") newStatus = "stopped";
    if (signal === "restart") newStatus = "starting";

    // Trigger monitoring if starting
    if (signal === "start" || signal === "restart") {
      monitorDeploymentFlow(deployment._id, deployment.identifier);
    }

    const updatedDeployment = await Deployment.findByIdAndUpdate(
      req.params.id,
      { status: newStatus },
      { new: true },
    );

    // Audit Log with proper actor attribution (Fix: Issue #3)
    await logUserAction(
      req,
      `power_${signal}`,
      {
        type: "Deployment",
        id: deployment._id,
        name: deployment.botName,
      },
      {
        identifier: deployment.identifier,
        prevStatus: deployment.status,
        newStatus,
      },
    );

    successResponse(res, {
      message: `Signal ${signal} sent`,
      status: newStatus,
      deployment: updatedDeployment,
    });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @helper: Monitor Deployment using Bot Health Service
const monitorDeploymentFlow = async (deploymentId, identifier) => {
  try {
    console.log(`Starting health monitoring for ${identifier}`);
    await botHealthService.startMonitoring(deploymentId);
  } catch (error) {
    console.error("Monitoring flow error:", error.message);
  }
};

// @helper: Main deployment process logic
const processDeployment = async (deploymentId) => {
  let deployment;
  try {
    deployment = await Deployment.findById(deploymentId);
    if (!deployment) return;

    // Check for GitHub token
    if (!process.env.GITHUB_TOKEN) {
      /* ... same error handling ... */
      console.error("GITHUB_TOKEN not found in environment variables.");
      await Deployment.findByIdAndUpdate(deploymentId, {
        status: "failed",
        errorMessage: "GitHub token not configured.",
      });
      return;
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = "samkiell";
    const repo = "SAMKIEL-AI";
    const baseBranch = "main";

    // ✅ Fetch settings.js from repo
    // Note: We are no longer fetching the remote content to regex replace it.
    // Instead, we are constructing a NEW settings.js based on a template or
    // simply injecting our entire configuration logic if the repo structure supports it.
    // However, since we likely need to respect the original file's structure if it has internal logic,
    // we will stick to a safer "fetch and replace" but with expanded scope.

    let settingsResponse;
    try {
      settingsResponse = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        { owner, repo, path: "settings.js", ref: baseBranch },
      );
    } catch (e) {
      console.error("GitHub Fetch Error:", e);
      throw new Error(`Could not fetch settings.js from repo: ${e.message}`);
    }

    // --- DYNAMIC SETTINGS GENERATION ---
    const config = deployment.configuration || {};
    let features = config.featureToggles || {};

    // Convert Mongoose Map to plain object if necessary
    if (
      features instanceof Map ||
      (features && typeof features.get === "function")
    ) {
      const plainFeatures = {};
      // Mongoose Maps have an iterator
      for (const [key, val] of features.entries()) {
        plainFeatures[key] = val;
      }
      features = plainFeatures;
    } else if (typeof features === "object" && features !== null) {
      // It's already an object, ensure it's not a Mongoose subdocument wrapping a Map weirdly
      // If using .lean(), it would be an object. If not, it's a Map.
      // If it has _doc, we might need to access it differently? No, usually .get() works.
    }

    // Helper functions for safely injecting string values
    const safeMsg = (str) => (str ? str.replace(/"/g, '\\"') : "");
    const safeBool = (val) => (val ? "true" : "false");

    // 2. Inject Owner Number properly
    let ownerNumToInject = config.ownerNumber;

    // Fallback: If not in config, fetch from User profile
    if (!ownerNumToInject) {
      const userProfile = await User.findById(deployment.user);
      ownerNumToInject = userProfile ? userProfile.whatsappNumber : "";
    }

    // Sanitize Owner Number (digits only)
    ownerNumToInject = ownerNumToInject
      ? ownerNumToInject.replace(/\D/g, "")
      : "";

    if (!ownerNumToInject) {
      console.warn("Owner number missing for deployment", deployment._id);
    }

    // 3. Feature Logic
    // If UI sends "msg", then AUTO_STATUS_VIEW="on" AND STATUS_VIEW_MSG="on"
    // If UI sends "on", then AUTO_STATUS_VIEW="on" AND STATUS_VIEW_MSG="off"
    // If UI sends "off", then AUTO_STATUS_VIEW="off" AND STATUS_VIEW_MSG="off"
    const autoStatus =
      features.AUTO_STATUS_VIEW === "msg" || features.AUTO_STATUS_VIEW === "on"
        ? "on"
        : "off";

    const statusMsg = features.AUTO_STATUS_VIEW === "msg" ? "on" : "off";

    // 4. Construct Canonical Settings File (STRICT STRUCTURE)
    const modifiedSettings = `const settings = {
  // --- IDENTITY ---
  botName: "${safeMsg(deployment.botName)}",
  prefix: "${safeMsg(config.prefix || ".")}",
  botNumber: "${safeMsg(deployment.botNumber)}",
  ownerNumber: "${safeMsg(ownerNumToInject)}",
  ownerName: "${safeMsg(config.ownerName || "User")}",

  // --- BRANDING ---
  packname: "${safeMsg(config.packName || "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋")}",
  developer: "ѕαмкιєℓ.∂єν",
  portfolio: "https://samkiel.dev",
  website: "https://samkielbot.app",
  version: "2.7.0",

  // --- FEATURE TOGGLES ---
  featureToggles: {
    AUTO_STATUS_VIEW: "${autoStatus}",     // ⚠️ STRING ONLY
    STATUS_VIEW_MSG: "${statusMsg}",       // ⚠️ STRING ONLY

    ENABLE_STATUS_REACTION: ${safeBool(features.ENABLE_STATUS_REACTION)},
    ANTI_DELETE: ${safeBool(features.ANTI_DELETE)},
    SEND_READ: ${safeBool(features.SEND_READ)},
    ALWAYS_ONLINE: ${safeBool(features.ALWAYS_ONLINE)},
    REJECT_CALL: ${safeBool(features.REJECT_CALL)},
    PERSONAL_MESSAGE: ${safeBool(features.PERSONAL_MESSAGE)},
    DISABLE_START_MESSAGE: ${safeBool(features.DISABLE_START_MESSAGE)},
    RANKING: ${safeBool(features.RANKING)},
    AUTO_REACTION: ${safeBool(features.AUTO_REACTION)},

    // --- NEW FEATURES ---
    ANTI_LINK: ${safeBool(features.ANTI_LINK)},
    ANTI_BADWORD: ${safeBool(features.ANTI_BADWORD)},
    AUTO_READ: ${safeBool(features.AUTO_READ)},
    CHATBOT: ${safeBool(features.CHATBOT)},
    AUTO_BIO: ${safeBool(features.AUTO_BIO)},
    AUTO_TYPING: ${safeBool(features.AUTO_TYPING)},
    AUTO_RECORDING: ${safeBool(features.AUTO_RECORDING)},
    FAILSAFE: ${safeBool(features.FAILSAFE)},
    LOCKDOWN: ${safeBool(features.LOCKDOWN)},
    // --- END NEW FEATURES ---

    STATUS_VIEW_EMOJI: "${safeMsg(features.STATUS_VIEW_EMOJI || "👀")}",
    ANTI_DELETE_TYPE: "${safeMsg(features.ANTI_DELETE_TYPE || "group")}",
    COMMAND_MODE: "${safeMsg(features.COMMAND_MODE || "public")}",
    VOICE_CHAT: ${safeBool(features.VOICE_CHAT)},
    PACKNAME: "${safeMsg(config.packName || "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋")}"
  },

  giphyApiKey: "qnl7ssQChTdPjsKta2Ax2LMaGXz303tq",
  updateZipUrl: ""
};

module.exports = settings;`;

    // --- END DYNAMIC SETTINGS ---

    // ✅ Create one branch per bot.
    const branchName = `bot-${deployment.botNumber}`;

    // ... (Git logic same as before)
    // Check if branch exists, if so, update validation or force update
    // We'll try to get the ref, if fails, create it.
    let sha; // sha of the new file
    try {
      // Try creating branch from main
      const baseRef = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${baseBranch}`,
      });

      // Check if our branch exists
      try {
        await octokit.git.getRef({ owner, repo, ref: `heads/${branchName}` });
      } catch (err) {
        // Create branch
        await octokit.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branchName}`,
          sha: baseRef.data.object.sha,
        });
      }
    } catch (e) {
      console.error("Git Branch Error", e);
      throw new Error("Failed to manage Git branches.");
    }

    let currentFileSha;
    try {
      const fileInBranch = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner,
          repo,
          path: "settings.js",
          ref: branchName,
        },
      );
      currentFileSha = fileInBranch.data.sha;
    } catch (e) {
      currentFileSha = settingsResponse.data.sha;
    }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: "settings.js",
      message: `Update settings for Bot ${deployment.botNumber}`,
      content: Buffer.from(modifiedSettings).toString("base64"),
      branch: branchName,
      sha: currentFileSha,
    });

    // ✅ Deploy via Pterodactyl API
    const pteroData = await pterodactyl.createServer({
      botName: deployment.botName || `Bot ${deployment.botNumber}`,
      botNumber: deployment.botNumber,
      userId: deployment.user,
      branch: branchName,
      disk: deployment.resources?.diskLimit || 500,
      memory: deployment.resources?.ramLimit || 300,
      cpu: deployment.resources?.cpuLimit || 25,
    });

    // ✅ Update DB
    const savedServer = await Deployment.findByIdAndUpdate(
      deploymentId,
      {
        pterodactylId: pteroData.pterodactylId,
        pterodactylUuid: pteroData.pterodactylUuid,
        identifier: pteroData.identifier,
        nodeId: pteroData.nodeId,
        eggId: pteroData.eggId,
        status: "installing", // Will be 'running' after we start it? Or installing while it clones?
      },
      { new: true },
    );

    // ✅ Start the server after installation completes
    console.log(
      `Waiting for server ${pteroData.identifier} to finish installing...`,
    );
    try {
      await pterodactyl.waitForInstallation(pteroData.identifier);

      console.log(`Starting server ${pteroData.identifier}...`);
      await pterodactyl.requestPowerAction(pteroData.identifier, "start");

      // Update status to likely 'starting'
      await Deployment.findByIdAndUpdate(deploymentId, { status: "starting" });

      // Start Monitoring
      monitorDeploymentFlow(deploymentId, pteroData.identifier);

      // ✅ Delete GitHub branch after successful deployment
      // We grant the server 90 seconds to finish its initial clone before deleting the branch.
      // If we delete too fast, Pterodactyl's startup script will fail.
      setTimeout(async () => {
        try {
          const branchToDelete = `bot-${deployment.botNumber}`;
          console.log(`[Git] ⏳ Delayed deletion of branch: ${branchToDelete}`);
          await octokit.git.deleteRef({
            owner,
            repo,
            ref: `heads/${branchToDelete}`,
          });
          console.log(
            `[Git] ✅ Successfully deleted branch: ${branchToDelete}`,
          );
        } catch (gitError) {
          if (gitError.status !== 404) {
            console.error(
              `[Git] Failed to delete branch after deployment: ${gitError.message}`,
            );
          }
        }
      }, 90000); // 90 second delay for safety
    } catch (startError) {
      console.error(
        "Error starting server after creation:",
        startError.response?.data || startError.message,
      );
      // Don't fail the whole request, as the server IS created.
    }
  } catch (error) {
    console.error("Deployment error:", error);

    // Refund credits on deployment failure
    try {
      // creditService is imported at top level
      if (deployment.totalCost > 0) {
        await creditService.addCredits(
          deployment.user,
          deployment.totalCost,
          "refund",
          `Refund for failed deployment: ${deployment.botName}`,
          { deployment: deployment._id },
        );

        // Notify user about the refund
        await Notification.create({
          user: deployment.user,
          title: "Deployment Failed (Refunded) ❌",
          message: `Your deployment for "${deployment.botName}" failed and ${deployment.totalCost} credits have been refunded to your account.`,
          type: "error",
        });
      }
    } catch (refundError) {
      console.error(
        "Critical: Failed to refund credits after deployment failure:",
        refundError,
      );
    }

    await Deployment.findByIdAndUpdate(deploymentId, {
      status: "failed",
      errorMessage: error.message || "Deployment failed.",
    });
  }
};

module.exports = {
  deployBot,
  getDeployments,
  updateDeployment,
  createDeployment,
  controlServer,
  deleteDeployment, // Exported
  // ... other exports ...
};
