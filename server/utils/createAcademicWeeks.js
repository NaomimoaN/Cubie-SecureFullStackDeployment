/**
 * @purpose 2024-2025学年度のacademic_weeksデータを作成するスクリプト
 */

import mongoose from "mongoose";
import AcademicWeek from "../models/AcademicWeek.js";

// MongoDB接続文字列（環境変数から取得、なければローカルを使用）
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/cubie";

const createAcademicWeeks = async () => {
  try {
    console.log("📅 Academic Weeks データ作成を開始します...");

    // MongoDB接続
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB接続成功");

    // 既存のデータを削除
    await AcademicWeek.deleteMany({ schoolYear: "2024-2025" });
    console.log("🧹 既存のacademic weeksデータを削除しました");

    // 2024年9月2日（月曜日）から開始
    const schoolStartDate = new Date("2024-09-02");
    const schoolYear = "2024-2025";
    const totalWeeks = 40; // 学年全体で40週

    const weekData = [];

    for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
      // 各週の開始日（月曜日）を計算
      const startDate = new Date(schoolStartDate);
      startDate.setDate(schoolStartDate.getDate() + (weekNum - 1) * 7);

      // 各週の終了日（金曜日）を計算
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 4); // 月曜日から金曜日まで

      weekData.push({
        week: weekNum,
        startDate: startDate,
        endDate: endDate,
        schoolYear: schoolYear,
        description: `Week ${weekNum} of 2024-2025 academic year`,
        isActive: true,
      });
    }

    // データベースに挿入
    const result = await AcademicWeek.insertMany(weekData);
    console.log(`✅ ${result.length}週分のデータを作成しました`);

    // 作成されたデータの確認（最初の5週と最後の5週を表示）
    console.log("\n📋 作成されたデータの例:");
    console.log("最初の5週:");
    result.slice(0, 5).forEach((week) => {
      console.log(
        `  Week ${
          week.week
        }: ${week.startDate.toLocaleDateString()} - ${week.endDate.toLocaleDateString()}`
      );
    });

    console.log("最後の5週:");
    result.slice(-5).forEach((week) => {
      console.log(
        `  Week ${
          week.week
        }: ${week.startDate.toLocaleDateString()} - ${week.endDate.toLocaleDateString()}`
      );
    });

    // 特定の日付で検索テスト
    console.log("\n🔍 検索テスト:");
    const testDate = "2024-10-15";
    const foundWeek = await AcademicWeek.findWeekByDate(testDate, schoolYear);
    if (foundWeek) {
      console.log(
        `${testDate} は Week ${
          foundWeek.week
        } (${foundWeek.startDate.toLocaleDateString()} - ${foundWeek.endDate.toLocaleDateString()}) に該当します`
      );
    } else {
      console.log(`${testDate} に該当する週が見つかりませんでした`);
    }

    // 今日の日付で検索テスト
    const today = new Date().toISOString().split("T")[0];
    const todayWeek = await AcademicWeek.findWeekByDate(today, schoolYear);
    if (todayWeek) {
      console.log(`今日 (${today}) は Week ${todayWeek.week} に該当します`);
    } else {
      console.log(`今日 (${today}) に該当する週が見つかりませんでした`);
    }
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
  } finally {
    await mongoose.connection.close();
    console.log("📝 データベース接続を終了しました");
  }
};

// スクリプトを実行
createAcademicWeeks();
