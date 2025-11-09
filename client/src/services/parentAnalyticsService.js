import { api } from "./api";

/**
 * 親の子供のterm別科目別平均点を取得
 * @param {number} term - 学期番号 (1, 2, 3)
 * @returns {Promise} API response with subject scores data
 */
export const getScoresBySubject = async (term = 3) => {
  try {
    const response = await api.get(
      `/api/parent/analytics/scores-by-subject?term=${term}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching scores by subject:", error);
    throw error;
  }
};
