// client/src/services/adminService.js
/**
 * @file This module provides administrative functionalities.
 * It includes operations such as importing user data into the system.
 */

import { api } from "./api.js";

const adminService = {
  /**
   * Imports user data into the system.
   * @param {Array<Object>} usersData - An array of user objects to be imported.
   * @returns {Object} - The response data from the import operation, typically containing success status or imported user details.
   */
  importUsers: async (usersData) => {
    try {
      const response = await api.post("/api/admin/users/import", {
        users: usersData,
      });
      return response.data;
    } catch (error) {
      console.error(
        "Error during user import:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export default adminService;
