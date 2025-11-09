/**
 * @purpose Week 39の5日分の出席データを生成するスクリプト
 * 今週の出席率推移を確認するためのテストデータ
 */

import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import User from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const addWeeklyAttendanceData = async () => {
  try {
    await connectDB();

    // Division 14の生徒を取得
    const students = await User.find({
      role: "student",
      "profile.division": 14,
    });

    if (students.length === 0) {
      console.log("Division 14の生徒が見つかりません");
      return;
    }

    console.log(`Division 14の生徒数: ${students.length}人`);

    // Week 39の5日分のデータを生成
    const weekDates = [
      "2025-06-23", // 月曜日
      "2025-06-24", // 火曜日
      "2025-06-25", // 水曜日
      "2025-06-26", // 木曜日
      "2025-06-27", // 金曜日
    ];

    // 各日の出席率を段階的に変化させる（月曜日から金曜日にかけて）
    const attendanceRates = [0.95, 0.92, 0.88, 0.85, 0.9]; // 95% → 92% → 88% → 85% → 90%

    let totalRecordsAdded = 0;

    for (let dayIndex = 0; dayIndex < weekDates.length; dayIndex++) {
      const date = weekDates[dayIndex];
      const targetAttendanceRate = attendanceRates[dayIndex];

      console.log(
        `\n📅 ${date}のデータを生成中... (目標出席率: ${(
          targetAttendanceRate * 100
        ).toFixed(1)}%)`
      );

      // 既存のデータを削除
      await Attendance.deleteMany({
        date: new Date(date),
        week: 39,
      });

      const attendanceRecords = [];

      for (const student of students) {
        let status;
        const random = Math.random();

        if (random < targetAttendanceRate) {
          status = "present";
        } else if (random < targetAttendanceRate + 0.03) {
          // 3%の遅刻
          status = "late";
        } else {
          status = "absent";
        }

        attendanceRecords.push({
          studentId: student._id,
          date: new Date(date),
          status: status,
          week: 39,
          notes: status === "late" ? "遅刻" : status === "absent" ? "欠席" : "",
        });
      }

      // バッチでデータを挿入
      await Attendance.insertMany(attendanceRecords);

      // 統計を計算
      const presentCount = attendanceRecords.filter(
        (r) => r.status === "present"
      ).length;
      const lateCount = attendanceRecords.filter(
        (r) => r.status === "late"
      ).length;
      const absentCount = attendanceRecords.filter(
        (r) => r.status === "absent"
      ).length;
      const actualAttendanceRate = (
        (presentCount / attendanceRecords.length) *
        100
      ).toFixed(1);

      console.log(
        `✅ ${date}: 出席${presentCount}人, 遅刻${lateCount}人, 欠席${absentCount}人 (出席率: ${actualAttendanceRate}%)`
      );
      totalRecordsAdded += attendanceRecords.length;
    }

    console.log(`\n🎉 Week 39の出席データ生成完了!`);
    console.log(`📊 合計レコード数: ${totalRecordsAdded}件`);
    console.log(
      `📅 対象期間: ${weekDates[0]} ~ ${weekDates[weekDates.length - 1]}`
    );
    console.log(`🎯 Division: 14, Week: 39`);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB接続を終了しました");
  }
};

// スクリプトを実行
addWeeklyAttendanceData();
