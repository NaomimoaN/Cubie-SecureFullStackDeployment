// client/src/services/subjectService.js
/**
 * Manages all client-side API interactions for subject-related operations.
 * This includes fetching all subjects and updating individual subject descriptions.
 */

import { api } from "./api";

/**
 * Fetches all available subjects.
 * @returns {Array<Object>} - An array of subject objects.
 */
export const getAllSubjects = async () => {
  try {
    const response = await api.get("/api/subjects");
    return response.data;
  } catch (error) {
    console.error("Error fetching all subjects:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Updates the description for a specific subject.
 * @param {string} subjectId - The unique identifier of the subject.
 * @param {string} newDescription - The new description for the subject.
 * @returns {Object} - The updated subject data.
 */
export const updateSubjectDescription = async (subjectId, newDescription) => {
  try {
    const response = await api.patch(`/api/subjects/${subjectId}/description`, {
      description: newDescription,
    });
    return response.data;
  } catch (error) {
    console.error(
      `Error updating subject description for ID ${subjectId}:`,
      error
    );
    throw error.response?.data?.message || error.message;
  }
};
