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
    const memPaths = [
      `/v2/monitoring/metrics/droplet/memory_available`,
      `/v2/monitoring/metrics/droplet/memory_free`,
      `/v2/monitoring/metrics/droplet/memory`,
    ];
    const fsPath = `/v2/monitoring/metrics/droplet/filesystem_free`;

    // Helper to fetch single metric with 404 safety
    const fetchMetric = async (path) => {
      try {
        const res = await api.get(path, {
          params: { host_id: dropletId, start, end },
        });
        return res.data.data.result;
      } catch (err) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    };

    // Helper to try multiple paths for memory
    const fetchMemory = async () => {
      for (const path of memPaths) {
        const result = await fetchMetric(path);
        if (result && result.length > 0) {
          // Tag the result with the metric type so we know how to calculate it
          return {
            type: path.split("/").pop(),
            result,
          };
        }
      }
      return null;
    };

    const [cpu, memoryData, filesystem] = await Promise.all([
      fetchMetric(cpuPath),
      fetchMemory(),
      fetchMetric(fsPath),
    ]);

    return {
      cpu,
      memory: memoryData?.result || null,
      memoryType: memoryData?.type || "unknown",
      filesystem,
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
