/**
 * @purpose 提出統計関連のAPI呼び出しを管理
 * 先生のdivision向けの提出率統計、週次比較、カスタム期間分析を提供
 */

import { api } from "./api";

/**
 * 先生のdivisionの提出統計を取得（今週と先週の比較）
 */
const getSubmissionStats = async () => {
  try {
    console.log("🚀 API Request: GET /api/analytics/division/submission-stats");
    console.log("🔗 Base URL:", api.defaults.baseURL);

    const response = await api.get("/api/analytics/division/submission-stats");
    console.log("✅ API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ API Error:", error);
    console.error("❌ Error Response:", error.response);
    console.error("❌ Error Status:", error.response?.status);
    console.error("❌ Error Data:", error.response?.data);
    console.error("❌ Request URL:", error.config?.url);
    console.error("❌ Full Request Config:", error.config);
    throw error.response?.data || error.message;
  }
};

/**
 * カスタム期間の提出統計を取得
 */
const getCustomPeriodStats = async (startDate, endDate) => {
  try {
    const response = await api.get(
      "/api/analytics/division/submission-stats/custom",
      {
        params: { startDate, endDate },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching custom period stats:", error);
    throw error.response?.data || error.message;
  }
};

/**
 * 週間出席統計を取得（今週の5日分の出席率）
 */
const getWeeklyAttendanceStats = async () => {
  try {
    console.log("🚀 API Request: GET /api/analytics/attendance/weekly-stats");
    const response = await api.get("/api/analytics/attendance/weekly-stats");
    console.log("✅ Weekly Attendance Stats Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Weekly Attendance Stats Error:", error);
    console.error("❌ Error Response:", error.response?.data);
    throw error.response?.data || error.message;
  }
};

/**
 * 現在の学期を取得
 */
export const getCurrentTerm = async () => {
  try {
    const response = await api.get("/api/analytics/current-week/term");
    return response.data;
  } catch (error) {
    console.error("Current Term Error:", error);
    throw error;
  }
};

export { getSubmissionStats, getCustomPeriodStats, getWeeklyAttendanceStats };
