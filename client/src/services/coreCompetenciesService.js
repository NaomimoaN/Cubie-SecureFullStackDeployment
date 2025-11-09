/**
 * @purpose Core Competencies（中核的能力）分析用APIサービス
 * Week別のrubric scores統計を取得
 */

import { api } from "./api";

/**
 * 現在の週のCore Competencies平均値を取得（動的）
 */
const getCurrentWeekCoreCompetencies = async () => {
  try {
    // まず現在の週を取得
    const currentWeekResponse = await api.get("/api/analytics/current-week");
    // 修正: data.data.week から取得
    const currentWeek = currentWeekResponse.data.data.week;

    // 現在の週のCore Competenciesデータを取得
    const response = await api.get(
      `/api/analytics/core-competencies/week/${currentWeek}/rubric-averages`
    );
    return response.data;
  } catch (error) {
    console.error("Current Week Core Competencies Error:", error);

    // エラーオブジェクトを適切に投げる
    const errorToThrow = {
      message:
        error.response?.data?.message || error.message || "Unknown error",
      response: error.response,
    };
    throw errorToThrow;
  }
};

/**
 * Week 39のCore Competencies平均値を取得（後方互換性のため）
 */
const getWeek39CoreCompetencies = async () => {
  return getCurrentWeekCoreCompetencies();
};

/**
 * 指定WeekのCore Competencies平均値を取得
 */
const getWeekCoreCompetencies = async (week) => {
  try {
    const response = await api.get(
      `/api/analytics/core-competencies/week/${week}/rubric-averages`
    );
    return response.data;
  } catch (error) {
    console.error(`Week ${week} Core Competencies Error:`, error);

    // エラーオブジェクトを適切に投げる
    const errorToThrow = {
      message:
        error.response?.data?.message || error.message || "Unknown error",
      response: error.response,
    };
    throw errorToThrow;
  }
};

export {
  getCurrentWeekCoreCompetencies,
  getWeek39CoreCompetencies,
  getWeekCoreCompetencies,
};
