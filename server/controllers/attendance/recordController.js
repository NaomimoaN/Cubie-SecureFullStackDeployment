/**
 * @purpose 出席記録の保存・更新を管理するコントローラー
 * 出席チェックリストからの記録保存を担当
 */

import asyncHandler from "express-async-handler";
import User from "../../models/userModel.js";
import Attendance from "../../models/Attendance.js";
import AcademicWeek from "../../models/AcademicWeek.js";
import moment from "moment-timezone";

/**
 * @purpose 出席記録を保存（週番号の自動取得付き）
 * @route POST /api/attendance/save-records
 * @access Private (teacher only)
 */
const saveAttendanceRecords = asyncHandler(async (req, res) => {
  const user = req.user;
  const { records, date, schoolYear = "2024-2025" } = req.body;

  // 先生の認証チェック
  if (user.role !== "teacher") {
    return res.status(403).json({
      success: false,
      message: "Only teachers can access this page.",
    });
  }

  if (!records || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Attendance record data is required.",
    });
  }

  if (!date) {
    return res.status(400).json({
      success: false,
      message: "Date is required.",
    });
  }

  try {
    console.log(
      `📝 Saving attendance records - Date: ${date}, Records: ${records.length}`
    );

    // Vancouver時間での日付範囲を計算（一度だけ）
    const vancouverStartOfDay = moment
      .tz(date, "America/Vancouver")
      .startOf("day")
      .toDate();
    const vancouverEndOfDay = moment
      .tz(date, "America/Vancouver")
      .endOf("day")
      .toDate();

    // 学生IDを抽出
    const studentIds = records.map((record) => record.studentId);

    // 学生データを一括取得
    const students = await User.find({
      _id: { $in: studentIds },
      role: "student",
    }).select("_id profile.firstName profile.lastName profile.division");

    // 学生IDをキーとしたマップを作成
    const studentMap = new Map(
      students.map((student) => [student._id.toString(), student])
    );

    // 既存の出席記録を一括取得
    const existingRecords = await Attendance.find({
      studentId: { $in: studentIds },
      date: {
        $gte: vancouverStartOfDay,
        $lt: vancouverEndOfDay,
      },
    });

    // 既存記録をマップ化
    const existingRecordMap = new Map(
      existingRecords.map((record) => [record.studentId.toString(), record])
    );

    // 週番号を一度だけ取得
    const academicWeek = await AcademicWeek.findWeekByDate(date, schoolYear);
    const weekNumber = academicWeek ? academicWeek.week : null;

    if (academicWeek) {
      console.log(`📅 Date ${date} corresponds to Week ${weekNumber}`);
    } else {
      console.log(`⚠️ No academic week found for date ${date}`);
    }

    const saveResults = [];
    const errors = [];
    const bulkOps = [];

    // 各記録を処理
    for (const record of records) {
      try {
        const { studentId, status, notes = "" } = record;

        if (!studentId || !status) {
          errors.push(
            `Student ID ${studentId}: studentId and status are required`
          );
          continue;
        }

        // 学生データをチェック
        const student = studentMap.get(studentId.toString());
        if (!student) {
          errors.push(`Student ID ${studentId}: No valid student found`);
          continue;
        }

        // 先生のdivisionと学生のdivisionをチェック
        if (student.profile?.division !== user.profile?.division) {
          errors.push(
            `Student ID ${studentId}: This student is not in your class`
          );
          continue;
        }

        const existingRecord = existingRecordMap.get(studentId.toString());

        if (existingRecord) {
          // 既存記録を更新
          bulkOps.push({
            updateOne: {
              filter: { _id: existingRecord._id },
              update: {
                $set: {
                  status: status,
                  notes: notes,
                  week: weekNumber,
                  recordedBy: user._id,
                  schoolYear: schoolYear,
                },
              },
            },
          });

          saveResults.push({
            studentId: studentId,
            studentName: `${student.profile?.firstName} ${student.profile?.lastName}`,
            status: status,
            week: weekNumber,
            action: "updated",
          });
        } else {
          // Vancouver時間で朝8時に設定
          const vancouverDate = moment
            .tz(date + "T08:00:00", "America/Vancouver")
            .toDate();

          // 新規記録を作成
          bulkOps.push({
            insertOne: {
              document: {
                studentId: studentId,
                date: vancouverDate,
                status: status,
                notes: notes,
                week: weekNumber,
                recordedBy: user._id,
                schoolYear: schoolYear,
              },
            },
          });

          saveResults.push({
            studentId: studentId,
            studentName: `${student.profile?.firstName} ${student.profile?.lastName}`,
            status: status,
            week: weekNumber,
            action: "created",
          });
        }
      } catch (recordError) {
        console.error(
          `Record processing error (student ID: ${record.studentId}):`,
          recordError
        );
        errors.push(`Student ID ${record.studentId}: ${recordError.message}`);
      }
    }

    // バルク操作を実行
    if (bulkOps.length > 0) {
      await Attendance.bulkWrite(bulkOps);
      console.log(`✅ Bulk operation completed for ${bulkOps.length} records`);
    }

    // 統計を計算
    const stats = saveResults.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      if (record.action === "created") acc.created = (acc.created || 0) + 1;
      if (record.action === "updated") acc.updated = (acc.updated || 0) + 1;
      return acc;
    }, {});

    console.log(
      `📊 Save completed - Success: ${saveResults.length}, Errors: ${errors.length}`
    );

    res.status(200).json({
      success: true,
      message: `Successfully saved attendance records. Success: ${saveResults.length} records, Errors: ${errors.length} records`,
      data: {
        date: date,
        week: weekNumber,
        schoolYear: schoolYear,
        savedRecords: saveResults,
        stats: stats,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("Attendance record saving error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save attendance records.",
      error: error.message,
    });
  }
});

export { saveAttendanceRecords };
