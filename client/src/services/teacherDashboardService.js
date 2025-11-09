import { api } from "./api";

/**
 * 提出統計チャート専用API
 */
export const getSubmissionStatsForChart = async () => {
  try {
    const response = await api.get(
      "/api/analytics/teacher/submission-stats-chart"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching submission stats for chart:", error);
    throw error;
  }
};

/**
 * 科目別コアコンピテンシーチャート専用API
 */
export const getCoreCompetenciesForChart = async () => {
  try {
    const response = await api.get(
      "/api/analytics/teacher/core-competencies-chart"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching core competencies for chart:", error);
    throw error;
  }
};

/**
 * 科目別バーチャート専用API
 */
export const getSubjectBarChartData = async () => {
  try {
    const response = await api.get("/api/analytics/teacher/subject-bar-chart");
    return response.data;
  } catch (error) {
    console.error("Error fetching subject bar chart data:", error);
    throw error;
  }
};

/**
 * 科目別ドーナツチャート専用API
 */
export const getSubjectDonutChartData = async () => {
  try {
    const response = await api.get(
      "/api/analytics/teacher/subject-donut-chart"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching subject donut chart data:", error);
    throw error;
  }
};
