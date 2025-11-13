// client/src/services/api.js

import axios from "axios";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

/**
 * Axios instance configured for API requests.
 * It sets the base URL and ensures credentials (like cookies) are sent with requests.
 * Also includes Authorization header with Bearer token if available in localStorage.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor to add Authorization header with Bearer token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("authToken");
    if (token) {
      // Add Authorization header with Bearer token
      config.headers.Authorization = `Bearer ${token}`;
      // Debug log (remove in production)
      console.log("🔐 API Request with Authorization header:", {
        url: config.url,
        method: config.method,
        hasToken: true,
        tokenPreview: token.substring(0, 20) + "...",
        fullHeaders: config.headers,
      });
    } else {
      console.log("⚠️ API Request without token:", {
        url: config.url,
        method: config.method,
        hasToken: false,
      });
    }
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("❌ API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      response: error.response?.data,
    });
    return Promise.reject(error);
  }
);
