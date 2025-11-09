// client/src/services/weekService.js

/**
 * Manages API interactions for week-related data.
 * This includes fetching weeks by subject ID, retrieving a specific week by ID, and updating week details.
 */

import { api } from "./api";

/**
 * Fetches weeks associated with a given subject ID.
 * @param {string} subjectId - The unique identifier of the subject.
 * @returns {Array<Object>} - An array of week objects.
 */
export const getWeeksBySubjectId = async (subjectId) => {
  try {
    if (!subjectId) {
      throw new Error("Subject ID is required to fetch weeks.");
    }
    const response = await api.get(`/api/weeks?subjectId=${subjectId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching weeks for subject ID ${subjectId}:`, error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Fetches details for a specific week by its ID.
 * @param {string} weekId - The unique identifier of the week.
 * @returns {Object} - The week's detailed information.
 */
export const getWeekById = async (weekId) => {
  try {
    if (!weekId) {
      throw new Error("Week ID is required to fetch week details.");
    }
    const response = await api.get(`/api/weeks/${weekId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching week with ID ${weekId}:`, error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Updates details for a specific week.
 * @param {string} weekId - The unique identifier of the week to update.
 * @param {Object} updateData - The data to update the week with.
 * @returns {Object} - The updated week data.
 */
export const updateWeek = async (weekId, updateData) => {
  try {
    if (!weekId) {
      throw new Error("Week ID is required to update week details.");
    }
    const response = await api.patch(`/api/weeks/${weekId}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Error updating week with ID ${weekId}:`, error);
    throw error.response?.data?.message || error.message;
  }
};
