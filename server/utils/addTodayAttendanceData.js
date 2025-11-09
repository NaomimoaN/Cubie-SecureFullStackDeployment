/**
 * @purpose 今日の日付の出欠データを追加するスクリプト
 * @author Naomi: 出欠管理
 * @note development only
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Attendance from "../models/Attendance.js";

// 環境変数を読み込み
dotenv.config();

const addTodayAttendanceData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Division 14の生徒を取得
    const students = await User.find({
      role: "student",
      "profile.division": 14,
    }).select("_id profile.firstName profile.lastName");

    console.log(`Division 14 students: ${students.length}`);

    if (students.length === 0) {
      console.log("No students found in Division 14");
      return;
    }

    // 特定の日付を設定（2025-06-10）
    const targetDate = new Date("2025-06-16");
    targetDate.setHours(8, 0, 0, 0); // 8:00 AMに設定

    // 既存の指定日の出欠データを削除
    await Attendance.deleteMany({
      studentId: { $in: students.map((s) => s._id) },
      date: {
        $gte: new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate()
        ),
        $lt: new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate() + 1
        ),
      },
    });

    // ランダムな出欠データを生成
    const attendanceData = students.map((student) => {
      // 出席率を高くするための重み付き確率
      const random = Math.random();
      let randomStatus;

      if (random < 0.95) {
        // 75%の確率で出席
        randomStatus = "present";
      } else if (random < 0.05) {
        // 5%の確率で遅刻
        randomStatus = "late";
      } else {
        // 15%の確率で欠席
        randomStatus = "absent";
      }

      return {
        studentId: student._id,
        date: targetDate,
        status: randomStatus,
        schoolYear: "2024-2025",
        week: 38,
        notes: randomStatus === "late" ? "reason: traffic jam" : "",
      };
    });

    // データベースに挿入
    const result = await Attendance.insertMany(attendanceData);
    console.log(`${result.length} attendance data added`);

    // 統計を表示
    const stats = {
      present: attendanceData.filter((a) => a.status === "present").length,
      absent: attendanceData.filter((a) => a.status === "absent").length,
      late: attendanceData.filter((a) => a.status === "late").length,
    };

    console.log("出欠統計:");
    console.log(`- 出席: ${stats.present}人`);
    console.log(`- 欠席: ${stats.absent}人`);
    console.log(`- 遅刻: ${stats.late}人`);
    console.log(`- 合計: ${attendanceData.length}人`);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  } finally {
    await mongoose.connection.close();
    console.log("データベース接続を閉じました");
  }
};

// スクリプトを実行
addTodayAttendanceData();
