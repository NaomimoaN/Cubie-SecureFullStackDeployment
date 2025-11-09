// client/src/services/authService.js
/**
 * Manages all client-side authentication interactions.
 * This includes user login, logout, session verification, and CSRF token handling.
 */

import { api } from "./api";

// axios is a library for HTTP request. To use it, you need to create an instance
// axios is the dependency for HTTP request;
// import axios from "axios";
// // vite-api-base-url: localhost5000
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// // --- Axios instance for reference---
// // create and export a configured axios instance
// export const api = axios.create({
//   baseURL: API_BASE_URL,
//   // cookies in request and enable session-based authentication; Send both to backend;
//   withCredentials: true,
// });

// --- Main: authService ---
// There are 2 post actions and 2 get actions in authService Object; login, logout, verifySession and getCrsfToken;
// There are 4 things can be done with this authService
const authService = {
  /**
   * Handles user login.
   * @param {Object} credentials - User login credentials (e.g., { email, password }).
   * @param {boolean} [isAdminLogin=false] - Optional. True if it's an admin login.
   * @returns {Object} - User data including id and assigned subjects upon successful login.
   */
  login: async (credentials, isAdminLogin = false) => {
    try {
      const endpoint = isAdminLogin
        ? "/api/auth/admin/login"
        : "/api/auth/login";
      const response = await api.post(endpoint, credentials);

      return {
        ...response.data,
        id: response.data.userId,
        assignedSubjects: response.data.assignedSubjects || [],
      };
    } catch (error) {
      console.error(
        "Error during login:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  /**
   * Handles user logout.
   * @throws {Error} - Throws an error if logout fails.
   */
  logout: async () => {
    try {
      // send a post request to the logout-endpoint;
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error(
        "Error during logout:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  /**
   * Verifies the current user session.
   * @returns {Object} - User data including id and assigned subjects if the session is valid.
   */
  verifySession: async () => {
    try {
      const response = await api.get("/api/auth/profile");

      return {
        ...response.data,
        id: response.data.userId,
        assignedSubjects: response.data.assignedSubjects || [],
      };
    } catch (error) {
      console.error(
        "Error verifying session:",
        error.response?.data?.message || error.message
      );
      throw error;
    }
  },

  /**
   * Fetches the CSRF token from the server.
   * @returns {string} - The CSRF token.
   */
  getCsrfToken: async () => {
    try {
      const response = await api.get("/api/csrf-token");
      return response.data.csrfToken;
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error.message);
      throw error;
    }
  },

  changePassword: async (passwordData) => {
    try {
      const response = await api.post(
        "/api/auth/change-password",
        passwordData
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error changing password:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  updateProfilePicture: async (imageFile) => {
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append("profilePicture", imageFile);

      // Call the real API endpoint
      const response = await api.post(
        "/api/auth/update-profile-picture",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error updating profile picture:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  updateNotificationSettings: async (settings) => {
    try {
      const response = await api.post(
        "/api/auth/update-notification-settings",
        settings
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error updating notification settings:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  updateAvatar: async (avatarUrl) => {
    try {
      const response = await api.post("/api/auth/update-avatar", {
        avatarUrl,
      });
      return response.data;
    } catch (error) {
      console.error(
        "Error updating avatar:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

/**
 * Axios request interceptor to attach CSRF token to non-GET requests.
 * It first fetches the CSRF token if not already present in headers.
 */
// Registers a request interceptor for the api axios instance
api.interceptors.request.use(
  async (config) => {
    if (config.method !== "get" && !config.headers["X-CSRF-Token"]) {
      try {
        const csrfToken = await authService.getCsrfToken();
        config.headers["X-CSRF-Token"] = csrfToken;
      } catch (error) {
        console.error(
          "Error setting CSRF token on request interceptor:",
          error
        );
        return Promise.reject(error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default authService;
