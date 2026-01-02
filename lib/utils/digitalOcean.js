const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const getDoApi = () => {
  const token = process.env.DIGITALOCEAN_TOKEN;
  return axios.create({
    baseURL: "https://api.digitalocean.com",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

/**
 * Get Droplet Metrics (Last 5 minutes)
 */
const getDropletMetrics = async (dropletId) => {
  const token = process.env.DIGITALOCEAN_TOKEN;
  if (!token || !dropletId) {
    throw new Error("DigitalOcean Token or Droplet ID missing");
  }

  try {
    const api = getDoApi();
    const end = Math.floor(Date.now() / 1000);
    const start = end - 300;

    // Explicitly using full paths and logging for debugging
    const cpuPath = `/v2/monitoring/metrics/droplet/cpu`;
    const memPath = `/v2/monitoring/metrics/droplet/memory`;
    const fsPath = `/v2/monitoring/metrics/droplet/filesystem_free`;

    // Log the full URLs that will be requested
    console.log(
      `[DigitalOcean] Requesting CPU metrics from: ${api.defaults.baseURL}${cpuPath}`
    );
    console.log(
      `[DigitalOcean] Requesting Memory metrics from: ${api.defaults.baseURL}${memPath}`
    );
    console.log(
      `[DigitalOcean] Requesting Filesystem metrics from: ${api.defaults.baseURL}${fsPath}`
    );

    const [cpuRes, memRes, fsRes] = await Promise.all([
      api.get(cpuPath, { params: { host_id: dropletId, start, end } }),
      api.get(memPath, { params: { host_id: dropletId, start, end } }),
      api.get(fsPath, { params: { host_id: dropletId, start, end } }),
    ]);

    return {
      cpu: cpuRes.data.data.result,
      memory: memRes.data.data.result,
      filesystem: fsRes.data.data.result,
    };
  } catch (error) {
    if (error.response?.status === 401) {
      console.error(
        `[DigitalOcean] 401 Unauthorized. Token starts with: ${
          process.env.DIGITALOCEAN_TOKEN
            ? process.env.DIGITALOCEAN_TOKEN.substring(0, 5)
            : "MISSING"
        }`
      );
    } else {
      console.error(
        `[DigitalOcean] Metrics error:`,
        error.response?.data || error.message
      );
    }
    throw error;
  }
};

/**
 * Get Droplet Info
 */
const getDropletInfo = async (dropletId) => {
  try {
    const api = getDoApi();
    const response = await api.get(`/v2/droplets/${dropletId}`);
    return response.data.droplet;
  } catch (error) {
    console.error(
      `[DigitalOcean] Info error:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

module.exports = {
  getDropletMetrics,
  getDropletInfo,
};
