// Use this as a template;
import { api } from "./api";
// DO NOT use axios directly.
// import axios from "axios";

/**
 * Fetch user data from the backend using objectId.
 * @param {string} objectId - The ID of the user to fetch data for.
 * @returns {Promise<Object>} - The user data from the backend.
 */
const fetchUserData = async (objectId) => {
  try {
    console.log(objectId); //testing: works
    // Make a GET request to the backend API
    const response = await api.get(`/api/userDBData/${objectId}`);
    console.log(response.data); // Log the response data for debugging
    return response.data; // Return the user data
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error; // Rethrow the error for further handling
  }
};

export default fetchUserData;
