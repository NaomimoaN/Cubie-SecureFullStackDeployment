import { api } from "./api";

/**
 * 学生のバッジ獲得状況を取得
 * @param {string} studentId - 学生ID
 * @returns {Object} バッジの獲得状況
 */
export const getStudentBadges = async (studentId) => {
  try {
    const response = await api.get(`/api/badges/student/${studentId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching student badges:", error);
    throw error;
  }
};

/**
 * 学生の1週間の出席状況を取得
 * @param {string} studentId - 学生ID
 * @param {string} startDate - 開始日 (YYYY-MM-DD)
 * @param {string} endDate - 終了日 (YYYY-MM-DD)
 * @returns {Object} 出席データ
 */
export const getStudentAttendanceForWeek = async (
  studentId,
  startDate,
  endDate
) => {
  try {
    const response = await api.get(`/api/attendance/student/${studentId}`, {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    throw error;
  }
};

/**
 * 学生の宿題提出状況を取得
 * @param {string} studentId - 学生ID
 * @param {string} startDate - 開始日 (YYYY-MM-DD)
 * @param {string} endDate - 終了日 (YYYY-MM-DD)
 * @returns {Object} 宿題提出データ
 */
export const getStudentHomeworkSubmissions = async (
  studentId,
  startDate,
  endDate
) => {
  try {
    const response = await api.get(`/api/submissions/student/${studentId}`, {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching student homework submissions:", error);
    throw error;
  }
};

/**
 * 学生の成績データを取得（Extendingの回数を確認するため）
 * @param {string} studentId - 学生ID
 * @returns {Object} 成績データ
 */
export const getStudentGrades = async (studentId) => {
  try {
    const response = await api.get(`/api/grades/student/${studentId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching student grades:", error);
    throw error;
  }
};
