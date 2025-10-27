const Deployment = require("../models/Deployment");
const { successResponse, errorResponse } = require("../utils/response");
const axios = require("axios");
const { Octokit } = require("@octokit/rest");

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
      console.error("GITHUB_TOKEN not found in environment variables.");
      await Deployment.findByIdAndUpdate(deploymentId, {
        status: "failed",
        errorMessage:
          "GitHub token not configured. Please check environment variables.",
      });
      return;
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = "samkiel488";
    const repo = "SAMKIEL-AI";
    const baseBranch = "main";

    // ✅ Fetch settings.js from repo
    const settingsResponse = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      { owner, repo, path: "settings.js", ref: baseBranch }
    );

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

    // ✅ Create a new branch
    const branchName = `blackboxai/bot-${deployment.botNumber}-${Date.now()}`;
    const baseRef = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });

    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseRef.data.object.sha,
    });

    // ✅ Commit updated settings.js
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: "settings.js",
      message: `Set bot number to ${deployment.botNumber}`,
      content: Buffer.from(modifiedSettings).toString("base64"),
      branch: branchName,
      sha: settingsResponse.data.sha,
    });

    // ✅ Deploy via Render API
    const renderResponse = await axios.post(
      "https://api.render.com/v1/services",
      {
        ownerId: process.env.RENDER_OWNER_ID,
        type: "web_service",
        name: `samkiel-bot-${deployment.botNumber}`,
        repo: `https://github.com/${owner}/${repo}`,
        branch: branchName,
        plan: "free",
        serviceDetails: {
          runtime: "node",
          buildCommand: "npm install",
          startCommand: "npm start",
          envSpecificDetails: {
            plan: "free",
            node: {
              version: "18",
            },
            buildCommand: "npm install",
            startCommand: "npm start",
          },
        },

        envVars: [{ key: "NODE_ENV", value: "production" }],
        plan: "free",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RENDER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const serviceId = renderResponse.data.id;

    // ✅ Update DB with Render service info
    await Deployment.findByIdAndUpdate(deploymentId, {
      serviceId,
      status: "running",
    });

    // ✅ Poll for pairing code
    await pollForPairingCode(deploymentId, serviceId);
  } catch (error) {
    console.error("Deployment error:", error);

    let errorMessage = "Deployment failed due to an unexpected error.";

    if (error.status === 401) {
      errorMessage =
        "Unauthorized — check your GitHub or Render API credentials.";
    } else if (error.status === 403) {
      errorMessage = "Access forbidden — verify GitHub token permissions.";
    } else if (error.status === 404) {
      errorMessage = "Repository or file not found.";
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      errorMessage = "Network error — please check your internet connection.";
    }

    await Deployment.findByIdAndUpdate(deploymentId, {
      status: "failed",
      errorMessage,
    });
  }
};

// @helper: Poll Render logs for pairing code
const pollForPairingCode = async (deploymentId, serviceId) => {
  const maxAttempts = 30; // Retry for ~5 minutes
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const logsResponse = await axios.get(
        `https://api.render.com/v1/services/${serviceId}/logs`,
        {
          headers: {
            Authorization: `Bearer ${process.env.RENDER_API_KEY}`,
          },
        }
      );

      const logs = logsResponse.data;
      const pairingCodeMatch = logs
        .join("\n")
        .match(/(\d{6})\s*(?:pairing code|is your code)/i);

      if (pairingCodeMatch) {
        await Deployment.findByIdAndUpdate(deploymentId, {
          pairingCode: pairingCodeMatch[1],
          status: "running",
        });
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 10000)); // wait 10s
      attempts++;
    } catch (error) {
      console.error("Error polling logs:", error.message);
      attempts++;
    }
  }

  await Deployment.findByIdAndUpdate(deploymentId, {
    status: "failed",
    errorMessage: "Pairing code not found within timeout period.",
  });
};

module.exports = {
  deployBot,
  getDeployments,
  updateDeployment,
  createDeployment,
};
