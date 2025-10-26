const Deployment = require("../models/Deployment");
const { successResponse, errorResponse } = require("../utils/response");
const axios = require("axios");
const { Octokit } = require("@octokit/rest");

// Deploy a bot manually
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

// Get user deployments
const getDeployments = async (req, res) => {
  try {
    const deployments = await Deployment.find({ user: req.user.id });
    successResponse(res, deployments);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// Update deployment
const updateDeployment = async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);
    if (!deployment) return errorResponse(res, "Deployment not found", 404);

    if (deployment.user.toString() !== req.user.id)
      return errorResponse(res, "Not authorized", 401);

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

// Create deployment
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

    // Run async deployment
    processDeployment(deployment._id);

    successResponse(res, deployment, 201);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// Actual deployment process
const processDeployment = async (deploymentId) => {
  try {
    const deployment = await Deployment.findById(deploymentId);
    if (!deployment) return;

    if (!process.env.GITHUB_TOKEN) {
      console.error("Missing GITHUB_TOKEN in env");
      await Deployment.findByIdAndUpdate(deploymentId, {
        status: "failed",
        errorMessage: "GitHub token missing in environment variables.",
      });
      return;
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = "samkiel488";
    const repo = "SAMKIEL-AI";
    const baseBranch = "main";

    // ✅ 1. Fetch current settings.js
    const settingsResponse = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      { owner, repo, path: "settings.js", ref: baseBranch }
    );

    const settingsContent = Buffer.from(
      settingsResponse.data.content,
      "base64"
    ).toString("utf-8");

    // ✅ 2. Replace bot number
    const modifiedSettings = settingsContent
      .replace(
        /botNumber:\s*["'`][^"'`]*["'`]/,
        `botNumber: "${deployment.botNumber}"`
      )
      .replace(
        /ownerNumber:\s*jidNormalizedUser\(["'`][^"'`]*["'`]\)/,
        `ownerNumber: jidNormalizedUser("${deployment.botNumber}@s.whatsapp.net")`
      );

    // ✅ 3. Create new branch
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

    // ✅ 4. Commit new settings.js
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: "settings.js",
      message: `Set bot number to ${deployment.botNumber}`,
      content: Buffer.from(modifiedSettings).toString("base64"),
      branch: branchName,
      sha: settingsResponse.data.sha,
    });

    // ✅ 5. Deploy to Render
    const renderResponse = await axios.post(
      "https://api.render.com/v1/services",
      {
        ownerId: process.env.RENDER_OWNER_ID,
        type: "web_service",
        name: `samkiel-bot-${deployment.botNumber}`,
        repo: `https://github.com/${owner}/${repo}`,
        branch: branchName,
        buildCommand: "npm install",
        startCommand: "npm start",
        plan: "free",
        envVars: [{ key: "NODE_ENV", value: "production" }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RENDER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const serviceId = renderResponse.data.id;

    await Deployment.findByIdAndUpdate(deploymentId, {
      serviceId,
      status: "running",
    });

    await pollForPairingCode(deploymentId, serviceId);
  } catch (error) {
    console.error("Deployment error:", error);
    let errorMessage = "Deployment failed due to an unexpected error.";

    if (error.status === 401)
      errorMessage =
        "Unauthorized — check your GitHub or Render API credentials.";
    else if (error.status === 403)
      errorMessage = "Access forbidden — verify GitHub token permissions.";
    else if (error.status === 404)
      errorMessage = "Repository or file not found.";
    else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED")
      errorMessage = "Network error — check internet connection.";

    await Deployment.findByIdAndUpdate(deploymentId, {
      status: "failed",
      errorMessage,
    });
  }
};

// Poll Render logs for pairing code
const pollForPairingCode = async (deploymentId, serviceId) => {
  const maxAttempts = 30;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const logsResponse = await axios.get(
        `https://api.render.com/v1/services/${serviceId}/logs`,
        {
          headers: { Authorization: `Bearer ${process.env.RENDER_API_KEY}` },
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

      await new Promise((resolve) => setTimeout(resolve, 10000));
      attempts++;
    } catch (error) {
      console.error("Error polling logs:", error.message);
      attempts++;
    }
  }

  await Deployment.findByIdAndUpdate(deploymentId, { status: "failed" });
};

module.exports = {
  deployBot,
  getDeployments,
  updateDeployment,
  createDeployment,
};
