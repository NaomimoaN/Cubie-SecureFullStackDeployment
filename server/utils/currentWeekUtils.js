/**
 * @purpose 現在の週を動的に取得するためのユーティリティ関数
 * ハードコーディングされたweek: 39を置き換えるために使用
 */

import AcademicWeek from "../models/AcademicWeek.js";

/**
 * 現在の週番号を取得
 * @param {string} schoolYear - 学年（デフォルト: "2024-2025"）
 * @returns {Promise<number>} 現在の週番号
 */
export const getCurrentWeekNumber = async (schoolYear = "2024-2025") => {
  try {
    const currentWeek = await AcademicWeek.getCurrentWeekSmart(schoolYear);

    if (currentWeek) {
      console.log(`📅 現在の週: Week ${currentWeek.week} (${schoolYear})`);
      return currentWeek.week;
    }

    // フォールバック: 現在の週が見つからない場合
    console.warn(
      "⚠️ 現在の週が見つかりません。デフォルトのWeek 39を使用します"
    );
    return 39;
  } catch (error) {
    console.error("❌ 現在の週取得エラー:", error);
    // エラー時のフォールバック
    return 39;
  }
};

/**
 * 現在の週の詳細情報を取得
 * @param {string} schoolYear - 学年（デフォルト: "2024-2025"）
 * @returns {Promise<Object|null>} 現在の週の詳細情報
 */
export const getCurrentWeekDetails = async (schoolYear = "2024-2025") => {
  try {
    const currentWeek = await AcademicWeek.getCurrentWeekSmart(schoolYear);

    if (currentWeek) {
      return {
        week: currentWeek.week,
        startDate: currentWeek.startDate,
        endDate: currentWeek.endDate,
        schoolYear: currentWeek.schoolYear,
        isSchoolBreak: currentWeek.isSchoolBreak,
        breakType: currentWeek.breakType,
        breakDescription: currentWeek.breakDescription,
        isCurrent: currentWeek.isCurrent,
      };
    }

    return null;
  } catch (error) {
    console.error("❌ 現在の週詳細取得エラー:", error);
    return null;
  }
};

/**
 * 休み期間かどうかを確認
 * @param {string} schoolYear - 学年（デフォルト: "2024-2025"）
 * @returns {Promise<boolean>} 休み期間の場合true
 */
export const isCurrentlySchoolBreak = async (schoolYear = "2024-2025") => {
  try {
    return await AcademicWeek.isCurrentlySchoolBreak(schoolYear);
  } catch (error) {
    console.error("❌ 休み期間判定エラー:", error);
    return false;
  }
};

/**
 * 最新の授業週番号を取得（休み期間でない週）
 * @param {string} schoolYear - 学年（デフォルト: "2024-2025"）
 * @returns {Promise<number>} 最新の授業週番号
 */
export const getLatestSchoolWeekNumber = async (schoolYear = "2024-2025") => {
  try {
    const latestWeek = await AcademicWeek.getLatestSchoolWeek(schoolYear);

    if (latestWeek) {
      console.log(`📚 最新の授業週: Week ${latestWeek.week} (${schoolYear})`);
      return latestWeek.week;
    }

    // フォールバック
    console.warn(
      "⚠️ 最新の授業週が見つかりません。デフォルトのWeek 39を使用します"
    );
    return 39;
  } catch (error) {
    console.error("❌ 最新授業週取得エラー:", error);
    return 39;
  }
};
