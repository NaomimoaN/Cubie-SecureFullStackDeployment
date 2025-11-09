import { api } from "./api";

export const getLetterGradesBySubject = async (term = 3) => {
  try {
    const response = await api.get(
      `/api/parent/analytics/letter-grades-by-subject?term=${term}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching letter grades by subject:", error);
    throw error;
  }
};
