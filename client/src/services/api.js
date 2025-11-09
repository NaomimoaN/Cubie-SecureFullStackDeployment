// client/src/services/api.js

import axios from "axios";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

/**
 * Axios instance configured for API requests.
 * It sets the base URL and ensures credentials (like cookies) are sent with requests.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
