import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🟢 Attached token to request:", config.url);
    } else {
      console.warn("⚠️ No token found for request:", config.url);
    }
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "🚨 Response error:",
      error.response?.status,
      error.response?.data
    );
    // Only logout on 401 if it's not a login/register request and not the verify endpoint
    if (
      error.response?.status === 401 &&
      !error.config.url.includes("/auth/login") &&
      !error.config.url.includes("/auth/register") &&
      !error.config.url.includes("/auth/verify")
    ) {
      console.warn("🔴 Unauthorized (401). Clearing session...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    // Show toast for network errors
    if (!error.response) {
      // Network error - show toast
      if (typeof window !== "undefined" && window.toast) {
        window.toast.error(
          "Could not connect to the server. Please check your connection."
        );
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const register = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data.data;
};

export const login = async (userData) => {
  const response = await api.post("/auth/login", userData);
  return response.data.data;
};

export const verifyToken = async () => {
  const response = await api.get("/auth/verify");
  return response.data.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put("/auth/profile", profileData);
  return response.data.data;
};

// Deploy API
export const deployBot = async (deployData) => {
  const response = await api.post("/deploy/create", deployData);
  return response.data.server || response.data.data; // Adjusted to backend response structure
};

export const getDeployments = async () => {
  const response = await api.get("/deploy");
  return response.data.data || response.data; // Adjust based on controller response structure (backend sends successResponse(res, deployments))
};

export const updateDeployment = async (id, updateData) => {
  const response = await api.put(`/deploy/${id}`, updateData);
  return response.data.data;
};

export const getDeploymentById = async (id) => {
  const response = await api.get(`/deploy/${id}`);
  return response.data.data;
};

export const controlBot = async (id, action) => {
  const response = await api.post(`/deploy/${id}/power`, { signal: action }); // start, stop, restart, kill
  return response.data;
};

export const deleteBot = async (id) => {
  const response = await api.delete(`/deploy/${id}`);
  return response.data;
};

// Update API
export const updateBot = async (updateData) => {
  const response = await api.post("/update", updateData);
  return response.data.data;
};

export const getUpdateHistory = async (deploymentId) => {
  const response = await api.get(`/update/${deploymentId}`);
  return response.data.data;
};
