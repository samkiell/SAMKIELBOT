const Deployment = require("../models/Deployment");
const { successResponse, errorResponse } = require("../utils/response");
const axios = require("axios");
const { Octokit } = require("@octokit/rest");
const pterodactyl = require("../utils/pterodactyl");

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

// @desc    Get all user deployments
// @route   GET /api/deploy
// @access  Private
const getDeployments = async (req, res) => {
  try {
    const deployments = await Deployment.find({ user: req.user.id });
    successResponse(res, deployments);
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
    const { botNumber } = req.body;

    if (!/^\d{10,15}$/.test(botNumber)) {
      return errorResponse(res, "Invalid WhatsApp number format", 400);
    }

    const deployment = await Deployment.create({
      user: req.user.id,
      botNumber,
      status: "deploying",
    });

    // Begin deployment process asynchronously
    processDeployment(deployment._id);

    successResponse(res, deployment, 201);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// @helper: Main deployment process logic
const processDeployment = async (deploymentId) => {
  try {
    const deployment = await Deployment.findById(deploymentId);
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

    // ✅ Update bot number in settings.js
    const modifiedSettings = settingsContent
      .replace(
        /botNumber:\s*["'`][^"'`]*["'`]/,
        `botNumber: "${deployment.botNumber}"`
      )
      .replace(
        /ownerNumber:\s*jidNormalizedUser\(["'`][^"'`]*["'`]\)/,
        `ownerNumber: jidNormalizedUser("${deployment.botNumber}@s.whatsapp.net")`
      );

    // ✅ Create one branch per bot. Using botNumber to identify it?
    // User flow: "pushes it into settings.js... then deployment start".
    // We create a specific branch for this user/deployment to avoid conflicts.
    // SHORTENED NAME to fit Pterodactyl 20-char limit (bot-1234567890 = 14 chars)
    const branchName = `bot-${deployment.botNumber}`;

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
        // It exists, we will commit on top of it or reset it?
        // Ideally we reset or just update the file in it.
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

    // Now update the file in that branch
    // We need the SHA of the file IN THAT BRANCH if it differs?
    // Simplified: Just get the file from the branch to get SHA, or use the one we fetched if branch is fresh.
    // Safer: Get file from branch.
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
      // If file doesn't exist in branch (unlikely if branched from main), use null?
      // logic implies it's there.
      // If it was a new branch from main, it has the file.
      // If we just created it, it has the main's file.
      currentFileSha = settingsResponse.data.sha;
    }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: "settings.js",
      message: `Set botNumber to ${deployment.botNumber}`,
      content: Buffer.from(modifiedSettings).toString("base64"),
      branch: branchName,
      sha: currentFileSha,
    });

    // ✅ Deploy via Pterodactyl API
    const pteroData = await pterodactyl.createServer({
      botName: `Bot ${deployment.botNumber}`,
      botNumber: deployment.botNumber,
      userId: deployment.user,
      branch: branchName,
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

    // ✅ Start the server immediately
    console.log(`Starting server ${pteroData.identifier}...`);
    try {
      await pterodactyl.requestPowerAction(pteroData.identifier, "start");
      // Update status to likely 'starting' or keep 'installing' as polling will update it.
    } catch (startError) {
      console.error(
        "Error starting server after creation:",
        startError.message
      );
      // Don't fail the whole request, as the server IS created.
    }
  } catch (error) {
    console.error("Deployment error:", error);
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
};
