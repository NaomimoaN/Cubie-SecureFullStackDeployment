import { api } from "./api";

export const getCoreCompetenciesBySubject = async (term = 3) => {
  try {
    const response = await api.get(
      `/api/parent/analytics/core-competencies-by-subject?term=${term}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching core competencies by subject:", error);
    throw error;
  }
};

export const getYearlyCoreCompBySubject = async (studentId) => {
  try {
    const response = await api.get(
      `/api/parent/analytics/yearly-core-comp/${studentId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching yearly core competencies by subject:", error);
    throw error;
  }
};
