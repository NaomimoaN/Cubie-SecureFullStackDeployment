/**
 * @purpose 出席管理用APIサービス
 * 学生データ取得、出席記録の管理など
 */

import { api } from "./api";
import moment from "moment-timezone";

/**
 * ログインした先生のdivisionの学生一覧を取得
 * GET /api/attendance/students/my-division
 */
export const getMyDivisionStudents = async () => {
  try {
    const response = await api.get("/api/attendance/students/my-division");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch students for my division:", error);
    throw error;
  }
};

/**
 * 特定divisionの学生一覧を取得（開発用）
 * GET /api/attendance/students/division/:division
 */
export const getStudentsByDivision = async (division) => {
  try {
    const response = await api.get(
      `/api/attendance/students/division/${division}`
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch students for division ${division}:`, error);
    throw error;
  }
};

/**
 * 出席記録を保存（週番号自動取得付き、Vancouver時間）
 * POST /api/attendance/save-records
 */
export const saveAttendanceRecords = async (
  records,
  date,
  schoolYear = "2024-2025"
) => {
  try {
    let dateStr;

    if (date instanceof Date) {
      // Dateオブジェクトの場合、Vancouver時間に変換
      const vancouverTime = moment(date)
        .tz("America/Vancouver")
        .format("YYYY-MM-DD");
      dateStr = vancouverTime;
    } else {
      // 文字列の場合、そのまま使用
      dateStr = date;
    }

    const requestData = {
      records: records,
      date: dateStr,
      schoolYear: schoolYear,
    };

    const response = await api.post(
      "/api/attendance/save-records",
      requestData
    );
    return response.data;
  } catch (error) {
    console.error("Failed to save attendance records:", error);
    throw error;
  }
};

/**
 * 特定日付の出席データを取得（Vancouver時間）
 * GET /api/attendance/my-division?date=YYYY-MM-DD
 */
export const getAttendanceByDate = async (date) => {
  try {
    let dateStr;

    if (date instanceof Date) {
      // Dateオブジェクトの場合、Vancouver時間に変換
      const vancouverTime = moment(date)
        .tz("America/Vancouver")
        .format("YYYY-MM-DD");
      dateStr = vancouverTime;
    } else {
      // 文字列の場合、そのまま使用
      dateStr = date;
    }

    const response = await api.get(
      `/api/attendance/my-division?date=${dateStr}`
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch attendance for date ${date}:`, error);
    throw error;
  }
};

/**
 * 出席統計を取得
 * GET /api/attendance/stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getAttendanceStats = async (startDate, endDate) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await api.get(
      `/api/attendance/stats?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch attendance stats:", error);
    throw error;
  }
};
