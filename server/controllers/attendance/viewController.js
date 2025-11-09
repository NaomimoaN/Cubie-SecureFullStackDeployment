/**
 * @purpose 出席データの閲覧・取得を管理するコントローラー
 * 出席状況の表示、履歴閲覧を担当
 */

import asyncHandler from "express-async-handler";
import User from "../../models/userModel.js";
import Attendance from "../../models/Attendance.js";
import moment from "moment-timezone";

/**
 * @purpose 指定されたdivisionの生徒の出欠状況を取得
 * @route GET /api/attendance/my-division
 * @access Private (teacher only)
 */
const getAttendanceByDivision = asyncHandler(async (req, res) => {
  const user = req.user;
  const { date } = req.query; // クエリパラメータから日付を取得

  // 先生かどうかチェック
  if (!user) {
    res.status(401);
    throw new Error("Unauthorized: No user found");
  }

  if (user.role !== "teacher") {
    res.status(403);
    throw new Error("Forbidden: Only teachers can access this data.");
  }

  // ログインユーザーのdivisionを取得
  const teacherDivision = user.profile?.division;

  if (!teacherDivision) {
    res.status(400);
    throw new Error("Teacher division not found in profile.");
  }

  console.log(`📋 Fetching attendance for Division ${teacherDivision}`);
  console.log(`📅 Requested date: ${date}`);

  try {
    // ログインした先生のdivisionの生徒を取得
    const students = await User.find({
      role: "student",
      "profile.division": teacherDivision,
    }).select("_id profile.firstName profile.lastName profile.studentId");

    if (students.length === 0) {
      return res.status(404).json({
        message: `No students found for division ${teacherDivision}`,
        data: [],
      });
    }

    const studentIds = students.map((student) => student._id);

    // Vancouver時間での日付処理
    const targetDate = date
      ? moment.tz(date, "America/Vancouver").toDate()
      : moment.tz("America/Vancouver").toDate();
    const vancouverStartOfDay = moment
      .tz(targetDate, "America/Vancouver")
      .startOf("day")
      .toDate();
    const vancouverEndOfDay = moment
      .tz(targetDate, "America/Vancouver")
      .endOf("day")
      .toDate();

    // Vancouver時間の日付文字列を取得（レスポンス用）
    const vancouverDateStr = moment
      .tz(targetDate, "America/Vancouver")
      .format("YYYY-MM-DD");

    console.log(`🕐 Date processing details:`);
    console.log(`  - Original date param: ${date}`);
    console.log(`  - Target date (UTC): ${targetDate.toISOString()}`);
    console.log(`  - Vancouver date string: ${vancouverDateStr}`);
    console.log(
      `  - Vancouver start of day: ${vancouverStartOfDay.toISOString()}`
    );
    console.log(`  - Vancouver end of day: ${vancouverEndOfDay.toISOString()}`);

    const attendanceRecords = await Attendance.find({
      studentId: { $in: studentIds },
      date: {
        $gte: vancouverStartOfDay,
        $lte: vancouverEndOfDay,
      },
    });

    console.log(
      `Found ${attendanceRecords.length} attendance records for ${
        targetDate.toISOString().split("T")[0]
      }`
    );

    // 生徒情報と出欠情報をマージ
    const attendanceData = students.map((student) => {
      const attendanceRecord = attendanceRecords.find(
        (record) => record.studentId.toString() === student._id.toString()
      );

      return {
        studentId: student._id,
        studentInfo: {
          firstName: student.profile?.firstName || "",
          lastName: student.profile?.lastName || "",
          userId: student._id.toString(),
          studentId: student.profile?.studentId || "",
        },
        attendance: {
          status: attendanceRecord?.status || "unknown",
          date: attendanceRecord?.date || targetDate,
          week: attendanceRecord?.week || null,
          notes: attendanceRecord?.notes || "",
        },
      };
    });

    // 統計を計算
    const stats = {
      present: attendanceData.filter((a) => a.attendance.status === "present")
        .length,
      absent: attendanceData.filter((a) => a.attendance.status === "absent")
        .length,
      late: attendanceData.filter((a) => a.attendance.status === "late").length,
      unknown: attendanceData.filter((a) => a.attendance.status === "unknown")
        .length,
      total: attendanceData.length,
    };

    res.status(200).json({
      message: `Record of Division ${teacherDivision}`,
      division: teacherDivision,
      date: vancouverDateStr,
      totalStudents: students.length,
      stats,
      data: attendanceData,
    });
  } catch (error) {
    console.error("Attendance record retrieval error:", error);
    res.status(500);
    throw new Error("Failed to retrieve attendance records.");
  }
});

/**
 * @purpose 出欠状況の統計を取得
 * @route GET /api/attendance/stats
 * @access Private (teacher only)
 */
const getAttendanceStats = asyncHandler(async (req, res) => {
  const user = req.user;
  const { startDate, endDate } = req.query;

  // 先生かどうかチェック
  if (user.role !== "teacher") {
    res.status(403);
    throw new Error("Access denied.");
  }

  const teacherDivision = user.profile?.division;
  if (!teacherDivision) {
    res.status(400);
    throw new Error("Teacher division not found in profile.");
  }

  try {
    const students = await User.find({
      role: "student",
      "profile.division": teacherDivision,
    }).select("_id");

    const studentIds = students.map((student) => student._id);

    // 期間の設定（デフォルトは今月）
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const attendanceRecords = await Attendance.find({
      studentId: { $in: studentIds },
      date: {
        $gte: start,
        $lte: end,
      },
    });

    // 統計を計算
    const stats = {
      present: attendanceRecords.filter((record) => record.status === "present")
        .length,
      absent: attendanceRecords.filter((record) => record.status === "absent")
        .length,
      late: attendanceRecords.filter((record) => record.status === "late")
        .length,
      total: attendanceRecords.length,
    };

    res.status(200).json({
      division: teacherDivision,
      period: { startDate: start, endDate: end },
      stats,
    });
  } catch (error) {
    console.error("Attendance statistics retrieval error:", error);
    res.status(500);
    throw new Error("Failed to retrieve attendance statistics.");
  }
});

export { getAttendanceByDivision, getAttendanceStats };
