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
const guardService = require("../services/guardService");

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
          pteroError.message
        );
        // We continue to delete from DB even if Pterodactyl fails (orphaned record cleanup)
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
      { new: true }
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
      packName = "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋x",
      featureToggles = {},
    } = req.body;

    // Validation
    if (!botNumber || !botName) {
      return errorResponse(
        res,
        "Bot name and WhatsApp number are required",
        400
      );
    }

    if (!/^\d{10,15}$/.test(botNumber)) {
      return errorResponse(
        res,
        "Invalid WhatsApp number format. Please enter a valid number (10-15 digits)",
        400
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
        400
      );
    }

    // --- ALL FEATURES ACCESSIBLE TO EVERYONE ---
    const cleanFeatures = { ...featureToggles };
    const finalPackName = packName || "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋";
    const finalPrefix = /^[!#./\\,?$+*%\-]$/.test(prefix) ? prefix : ".";
    // ------------------------------------------

    // ✅ OPERATIONAL LIMITS GUARD
    const guard = await guardService.canDeployBot(req.user.id);
    if (!guard.allowed) {
      return errorResponse(res, guard.message, 403);
    }

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
      selectedDisk
    );
    const dailyBurn = creditService.calculateDailyBurn(
      selectedCpu,
      selectedRam
    );

    // Check if user has sufficient credits
    const hasSufficientCredits = await creditService.hasSufficientCredits(
      req.user.id,
      costBreakdown.totalCost
    );

    if (!hasSufficientCredits) {
      const user = await User.findById(req.user.id);
      return errorResponse(
        res,
        `Insufficient credits! You have ${Math.round(
          user.credits
        )} credits but need ${
          costBreakdown.totalCost
        } credits to deploy this bot. Please purchase more credits to continue.`,
        403
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
        featureToggles: cleanFeatures,
      },
      creationCost: costBreakdown.creationCost,
      resourceCost: costBreakdown.resourceCost,
      totalCost: costBreakdown.totalCost,
      dailyBurn,
    });

    // Deduct credits
    await creditService.deductCredits(
      req.user.id,
      costBreakdown.totalCost,
      "bot_creation",
      `Created bot: ${botName}`,
      { deployment: deployment._id }
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

    successResponse(res, deployment, 201);
  } catch (error) {
    console.error("[Deploy] Create deployment error:", error);

    // Specific error messages based on error type
    if (error.code === 11000) {
      return errorResponse(
        res,
        "A bot with this WhatsApp number already exists",
        409
      );
    }

    if (error.name === "ValidationError") {
      return errorResponse(res, `Validation error: ${error.message}`, 400);
    }

    // Generic server error
    errorResponse(
      res,
      "Failed to create bot deployment. Please try again or contact support if the issue persists.",
      500
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

    if (deployment.user.toString() !== req.user.id) {
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
      { new: true }
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
    const branchName = `deploy-${deployment.botNumber}`; // Unique branch per bot to prevent cross-contamination

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
        { owner, repo, path: "settings.js", ref: baseBranch }
      );
    } catch (e) {
      console.error("GitHub Fetch Error:", e);
      throw new Error(`Could not fetch settings.js from repo: ${e.message}`);
    }

    const settingsContent = Buffer.from(
      settingsResponse.data.content,
      "base64"
    ).toString("utf-8");

    // --- DYNAMIC SETTINGS GENERATION ---
    const config = deployment.configuration || {};
    const features = config.featureToggles || {};

    // Helper functions for safely injecting string values
    const safeMsg = (str) => (str ? `"${str.replace(/"/g, '\\"')}"` : `""`);
    const safeBool = (val) => (val ? "true" : "false");

    // We replace the entire `featureToggles` object block to ensure clean state
    // This Regex looks for "featureToggles: { ... }" and replaces the content inside
    // Note: This relies on standard formatting in the template settings.js
    let modifiedSettings = settingsContent;

    // 1. Core Identity
    modifiedSettings = modifiedSettings
      .replace(
        /botNumber:\s*["'`][^"'`]*["'`]/,
        `botNumber: "${deployment.botNumber}"`
      )
      .replace(
        /ownerName:\s*["'`][^"'`]*["'`]/,
        `ownerName: ${safeMsg(config.ownerName)}`
      )
      .replace(
        /prefix:\s*["'`][^"'`]*["'`]/,
        `prefix: "${config.prefix || "."}"`
      )
      .replace(
        /global\.prefix\s*=\s*["'`][^"'`]*["'`]/,
        `global.prefix = "${config.prefix || "."}"`
      );

    // 2. Inject Owner Number properly
    let ownerNumToInject = config.ownerNumber;

    // Fallback: If not in config, fetch from User profile
    if (!ownerNumToInject) {
      const userProfile = await User.findById(deployment.user);
      ownerNumToInject = userProfile ? userProfile.whatsappNumber : "";
    }

    // Final safeguard: If still invalid, do NOT use ID. Leave blank or default.
    // However, the bot needs an owner. We'll use the deployment user ID only if we strictly have to,
    // but the user complained about it. It's better to log a warning or use a placeholder if valid number missing.
    // For now, let's ensure we prefer the whatsappNumber.
    if (!ownerNumToInject) {
      console.warn("Owner number missing for deployment", deployment._id);
      ownerNumToInject = ""; // Empty string is better than an ObjectID which breaks things
    }

    modifiedSettings = modifiedSettings.replace(
      /ownerNumber:\s*["'`][^"'`]*["'`]/,
      `ownerNumber: "${ownerNumToInject}"`
    );

    // 2.1 Inject Bot Name (Fix for "Josh" appearing as default)
    // Replace 'const botName = "..."' variable declaration
    modifiedSettings = modifiedSettings.replace(
      /const botName = \s*["'`][^"'`]*["'`];/,
      `const botName = "${deployment.botName}";`
    );

    // Also replace key in object just in case it's hardcoded there instead of referenced
    modifiedSettings = modifiedSettings.replace(
      /botName:\s*["'`][^"'`]*["'`],/,
      `botName: "${deployment.botName}",`
    );

    // 2.2 Metadata
    modifiedSettings = modifiedSettings
      .replace(/author:\s*["'`][^"'`]*["'`],?/, `author: "𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋",`)
      .replace(
        /description:\s*["'`][^"'`]*["'`],?/,
        `description: "This is a bot for managing group commands and automating tasks.",`
      )
      .replace(
        /updateZipUrl:\s*["'`][^"'`]*["'`],?/,
        `updateZipUrl: "https://github.com/samkiell/SAMKIEL-AI/archive/refs/heads/main.zip",`
      );

    // 3. Feature Toggles Injection
    // We construct the object string manually to ensure it's exact
    const autoStatus =
      features.AUTO_STATUS_VIEW === "msg"
        ? "on"
        : features.AUTO_STATUS_VIEW || "off";
    const statusMsg = features.AUTO_STATUS_VIEW === "msg" ? "on" : "off";

    const newFeaturesObj = `featureToggles: {
    AUTO_STATUS_VIEW: "${autoStatus}",
    ENABLE_STATUS_REACTION: ${safeBool(
      features.ENABLE_STATUS_REACTION || features.AUTO_REACTION
    )},
    STATUS_VIEW_EMOJI: "${features.STATUS_VIEW_EMOJI || "👀"}",
    STATUS_VIEW_MSG: "${statusMsg}",
    ANTI_DELETE: ${safeBool(features.ANTI_DELETE)},
    SEND_READ: ${safeBool(features.SEND_READ)},
    ALWAYS_ONLINE: ${safeBool(features.ALWAYS_ONLINE)},
    REJECT_CALL: ${safeBool(features.REJECT_CALL)},
    PERSONAL_MESSAGE: ${safeBool(features.PERSONAL_MESSAGE)},
    DISABLE_START_MESSAGE: ${safeBool(features.DISABLE_START_MESSAGE)},
    ANTI_DELETE_TYPE: "${features.ANTI_DELETE_TYPE || "all"}",
    COMMAND_MODE: "${features.COMMAND_MODE || "public"}",
    RANKING: ${safeBool(features.RANKING)},
    AUTO_REACTION: ${safeBool(features.AUTO_REACTION)},
    PACKNAME: ${safeMsg(config.packName)},
  }`;

    // Replace the existing object using a regex that captures the whole block
    // Assuming standard indentation "featureToggles: {"
    modifiedSettings = modifiedSettings.replace(
      /featureToggles:\s*{[\s\S]*?}/,
      newFeaturesObj
    );

    // --- END DYNAMIC SETTINGS ---

    // ✅ Create one branch per bot.
    // Check if branch exists, if so, force update it to match the latest main
    // This ensures every deployment uses the latest code from the repository.
    try {
      // Get the latest SHA from the base branch (main)
      const baseRef = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${baseBranch}`,
      });

      const latestSha = baseRef.data.object.sha;

      // Check if our bot-specific branch exists
      try {
        await octokit.git.getRef({ owner, repo, ref: `heads/${branchName}` });

        // Branch exists: Force-update its head to match the latest main SHA
        // This effectively "resets" the branch to match the current state of 'main'
        await octokit.git.updateRef({
          owner,
          repo,
          ref: `heads/${branchName}`,
          sha: latestSha,
          force: true,
        });
        console.log(
          `[Deploy] Updated existing branch ${branchName} to latest main SHA.`
        );
      } catch (err) {
        // Branch doesn't exist: Create it from the latest main SHA
        await octokit.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branchName}`,
          sha: latestSha,
        });
        console.log(
          `[Deploy] Created new branch ${branchName} from latest main SHA.`
        );
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
        }
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
      { new: true }
    );

    // ✅ Start the server after installation completes
    console.log(
      `Waiting for server ${pteroData.identifier} to finish installing...`
    );
    try {
      await pterodactyl.waitForInstallation(pteroData.identifier);

      console.log(`Starting server ${pteroData.identifier}...`);
      await pterodactyl.requestPowerAction(pteroData.identifier, "start");

      // Update status to likely 'starting'
      await Deployment.findByIdAndUpdate(deploymentId, { status: "starting" });

      // Start Monitoring
      monitorDeploymentFlow(deploymentId, pteroData.identifier);
    } catch (startError) {
      console.error(
        "Error starting server after creation:",
        startError.response?.data || startError.message
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
          { deployment: deployment._id }
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
        refundError
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
