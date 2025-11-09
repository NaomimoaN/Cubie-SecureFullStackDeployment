import { api } from "./api.js";

/**
 * 親の子供のterm別科目別平均点を取得
 * @returns {Promise} APIレスポンス
 */
export const getAverageScoresBySubject = async () => {
  try {
    const response = await api.get(
      "/api/parent/analytics/average-scores-by-subject"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching average scores by subject:", error);
    throw error;
  }
};

/**
 * 特定の子供のterm別科目別平均点データを取得
 * @param {string} studentId - 子供のID
 * @param {Object} data - 全データ
 * @returns {Object} 特定の子供のデータ
 */
export const getStudentAverageScores = (studentId, data) => {
  if (!data || !data.students) {
    return null;
  }

  return data.students.find((student) => student.studentId === studentId);
};
