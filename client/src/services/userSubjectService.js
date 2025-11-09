import { api } from "./api";

export const getTeacherSubjects = async () => {
  try {
    const response = await api.get("/api/user-subjects/assigned-subjects");
    return response.data;
  } catch (error) {
    console.error("Error fetching teacher's assigned subjects:", error);
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Fetches subjects registered by a specific student.
 * If no userId is provided, it fetches for the currently logged-in student.
 * @param {string} [userId] - Optional. The unique identifier of the student whose subjects are to be fetched.
 * @returns {Array<Object>} - An array of subject objects registered by the student.
 */
export const getStudentSubjects = async (userId = null) => {
  try {
    const url = userId
      ? `/api/user-subjects/registered-subjects/${userId}`
      : "/api/user-subjects/registered-subjects";

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching student's registered subjects for user ID ${
        userId || "current user"
      }:`,
      error
    );
    throw error.response?.data?.message || error.message;
  }
};

export const getSubjectById = async (subjectId) => {
  try {
    const response = await api.get(`/api/subjects/${subjectId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching subject details for ID ${subjectId}:`, error);
    throw error.response?.data?.message || error.message;
  }
};
