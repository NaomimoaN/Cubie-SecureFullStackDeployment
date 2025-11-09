/**
 * @purpose 現在の週を取得するコントローラー
 */

import { getCurrentWeekNumber } from "../../utils/currentWeekUtils.js";
import AcademicWeek from "../../models/AcademicWeek.js";

/**
 * 現在の週を取得
 * @route GET /api/analytics/current-week
 * @access Private
 */
const getCurrentWeek = async (req, res) => {
  try {
    const currentWeek = await getCurrentWeekNumber();

    res.status(200).json({
      success: true,
      message: "現在の週を取得しました",
      data: {
        week: currentWeek,
      },
    });
  } catch (error) {
    console.error("現在の週取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "現在の週の取得に失敗しました。",
      error: error.message,
    });
  }
};

/**
 * 現在の学期を取得
 * @route GET /api/analytics/current-term
 * @access Private
 */
const getCurrentTerm = async (req, res) => {
  try {
    // isCurrent: trueのAcademicWeekを取得
    const currentAcademicWeek = await AcademicWeek.findOne({ isCurrent: true });

    if (!currentAcademicWeek) {
      return res.status(404).json({
        success: false,
        message: "現在の学期が見つかりません。",
      });
    }

    res.status(200).json({
      success: true,
      message: "現在の学期を取得しました",
      data: {
        term: currentAcademicWeek.term,
        week: currentAcademicWeek.week,
        schoolYear: currentAcademicWeek.schoolYear,
      },
    });
  } catch (error) {
    console.error("現在の学期取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "現在の学期の取得に失敗しました。",
      error: error.message,
    });
  }
};

export { getCurrentWeek, getCurrentTerm };
