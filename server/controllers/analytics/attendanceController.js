/**
 * @purpose 出欠管理の統計・分析専用コントローラー
 * 統計情報、データ生成、週間分析などの機能を提供
 */

import asyncHandler from "express-async-handler";
import User from "../../models/userModel.js";
import Attendance from "../../models/Attendance.js";
import Submission from "../../models/submissionModel.js";
import Homework from "../../models/homeworkModel.js";
import { getCurrentWeekNumber } from "../../utils/currentWeekUtils.js";

// === 開発用データ生成関数群 ===

// @desc    特定の日付の出欠データを生成（開発用）
// @route   POST /api/attendance/generate/:division
// @access  Development only
const generateAttendanceData = asyncHandler(async (req, res) => {
  const { division } = req.params;
  const { date } = req.body; // ボディから日付を取得

  try {
    // 日付が指定されていない場合は今日の日付を使用
    const targetDateStr = date || new Date().toISOString().split("T")[0];
    console.log(
      `Generating attendance data for division ${division} on ${targetDateStr}`
    );

    // 指定されたdivisionの生徒を取得
    const students = await User.find({
      role: "student",
      "profile.division": parseInt(division),
    }).select("_id profile.firstName profile.lastName");

    if (students.length === 0) {
      return res.status(404).json({
        message: `Division ${division}に登録された生徒が見つかりません。`,
      });
    }

    // 指定された日付を設定
    const targetDate = new Date(targetDateStr);
    targetDate.setHours(8, 0, 0, 0);

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
      const statuses = ["present", "absent", "late"];
      const randomStatus =
        statuses[Math.floor(Math.random() * statuses.length)];

      return {
        studentId: student._id,
        date: targetDate,
        status: randomStatus,
        schoolYear: "2024-2025",
        notes: randomStatus === "late" ? "reason: traffic jam" : "",
      };
    });

    // データベースに挿入
    const result = await Attendance.insertMany(attendanceData);
    console.log(`${result.length}件の出欠データを追加しました`);

    // 統計を計算
    const stats = {
      present: attendanceData.filter((a) => a.status === "present").length,
      absent: attendanceData.filter((a) => a.status === "absent").length,
      late: attendanceData.filter((a) => a.status === "late").length,
    };

    res.status(201).json({
      message: `Division ${division}の出欠データを生成しました`,
      date: targetDateStr,
      totalGenerated: result.length,
      stats: stats,
    });
  } catch (error) {
    console.error("出欠データ生成エラー:", error);
    res.status(500);
    throw new Error("出欠データの生成に失敗しました。");
  }
});

// @desc    出欠データベースを全て削除（開発用）
// @route   DELETE /api/attendance/clear-all
// @access  Development only
const clearAllAttendanceData = asyncHandler(async (req, res) => {
  try {
    console.log("全ての出欠データを削除中...");

    const result = await Attendance.deleteMany({});
    console.log(`${result.deletedCount}件の出欠データを削除しました`);

    res.status(200).json({
      message: "全ての出欠データを削除しました",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("出欠データ削除エラー:", error);
    res.status(500);
    throw new Error("出欠データの削除に失敗しました。");
  }
});

// @desc    ホームワーク提出データを生成（開発用）
// @route   POST /api/attendance/generate-submissions/:division
// @access  Development only
const generateSubmissionData = asyncHandler(async (req, res) => {
  const { division } = req.params;
  const { homeworkId } = req.body; // ボディからホームワークIDを取得

  try {
    console.log(
      `Generating submission data for division ${division}, homework ${homeworkId}`
    );

    // 指定されたホームワークIDが存在するかチェック
    const homework = await Homework.findById(homeworkId);

    if (!homework) {
      return res.status(404).json({
        message: `Homework ID ${homeworkId} not found`,
      });
    }
    console.log(`Homework found: ${homework.title}`);

    // dueDateを取得（存在しない場合はデフォルト値を設定）
    let dueDate;
    if (homework.dueDate) {
      dueDate = new Date(homework.dueDate);
    } else {
      // dueDateが設定されていない場合は、7日前をデフォルトの期限とする
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 7);
      console.log(
        `Warning: dueDate not found for homework. Using default: ${
          dueDate.toISOString().split("T")[0]
        }`
      );
    }
    console.log(`Due date: ${dueDate.toISOString().split("T")[0]}`);

    // 指定されたdivisionの生徒を取得
    const students = await User.find({
      role: "student",
      "profile.division": parseInt(division),
    }).select("_id profile.firstName profile.lastName");

    if (students.length === 0) {
      return res.status(404).json({
        message: `No students found for Division ${division}`,
      });
    }

    // 既存の提出データを削除（もしあれば）
    await Submission.deleteMany({
      homework: homeworkId,
      student: { $in: students.map((s) => s._id) },
    });

    // 提出パターンを定義
    const submissionPatterns = [
      { type: "submitted", ratio: 0.6 }, // 60% - 期限内提出済み
      { type: "late", ratio: 0.25 }, // 25% - 遅れて提出
      { type: "not_submitted", ratio: 0.15 }, // 15% - 未提出
    ];

    // 生徒をランダムに分類
    const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
    let currentIndex = 0;

    const submissionData = [];

    for (const pattern of submissionPatterns) {
      const count = Math.floor(students.length * pattern.ratio);
      console.log(`${pattern.type}: ${count} students`);

      for (let i = 0; i < count && currentIndex < students.length; i++) {
        const student = shuffledStudents[currentIndex++];

        if (pattern.type === "not_submitted") {
          // 未提出の場合はSubmissionレコードを作成しない
          continue;
        }

        // 提出日を計算（dueDateを基準に）
        let submittedAt;
        if (pattern.type === "submitted") {
          // 期限内提出: dueDate の 1-5日前にランダム
          submittedAt = new Date(dueDate);
          submittedAt.setDate(
            submittedAt.getDate() - Math.floor(Math.random() * 5) - 1
          );
        } else {
          // 遅れて提出: dueDate の 1-5日後にランダム
          submittedAt = new Date(dueDate);
          submittedAt.setDate(
            submittedAt.getDate() + Math.floor(Math.random() * 5) + 1
          );
        }

        // submissionStatusを決定（dueDateと比較）
        const submissionStatus = submittedAt <= dueDate ? "submitted" : "late";

        // ダミーファイル情報を生成
        const submittedFiles = [
          {
            fileName: `homework_${student.profile.firstName}_${student.profile.lastName}.pdf`,
            fileURL: `https://dummy-s3-bucket.com/submissions/${
              student._id
            }/${Date.now()}.pdf`,
            size: Math.floor(Math.random() * 5000000) + 100000, // 100KB-5MB
            s3Key: `submissions/${student._id}/${Date.now()}.pdf`,
            uploadedAt: submittedAt,
          },
        ];

        // 成績データを生成（一部の生徒のみ採点済み）
        const isGraded = Math.random() < 0.4; // 40%の確率で採点済み
        let grade = {
          score: null,
          letterGrade: null,
          rubricScores: {
            communication: null,
            creativeThinking: null,
            criticalThinking: null,
            identity: null,
            responsibility: null,
            socialResponsibility: null,
          },
          feedback: "",
          gradedBy: null,
          gradedAt: null,
        };

        if (isGraded) {
          const scores = [85, 90, 78, 92, 88, 75, 95, 82, 89, 91];
          const letterGrades = [
            "Emerging",
            "Developing",
            "Proficient",
            "Extending",
          ];
          const numericScore =
            scores[Math.floor(Math.random() * scores.length)];

          // Letter gradeをnumeric scoreに基づいて決定
          let letterGrade;
          if (numericScore >= 90) letterGrade = "Extending";
          else if (numericScore >= 80) letterGrade = "Proficient";
          else if (numericScore >= 70) letterGrade = "Developing";
          else letterGrade = "Emerging";

          // Rubric scoresをランダム生成（numeric scoreの±10範囲内）
          const generateRubricScore = (baseScore) => {
            const variation = Math.floor(Math.random() * 21) - 10; // -10 to +10
            return Math.max(0, Math.min(100, baseScore + variation));
          };

          grade = {
            score: numericScore,
            letterGrade: letterGrade,
            rubricScores: {
              communication: generateRubricScore(numericScore),
              creativeThinking: generateRubricScore(numericScore),
              criticalThinking: generateRubricScore(numericScore),
              identity: generateRubricScore(numericScore),
              responsibility: generateRubricScore(numericScore),
              socialResponsibility: generateRubricScore(numericScore),
            },
            feedback: [
              "Good job!",
              "Please explain it in more detail.",
              "Excellent answer!",
              "Please submit earlier next time.",
              "Good job, but please check for typos.",
            ][Math.floor(Math.random() * 5)],
            gradedBy: homework.uploadedBy, // ホームワークをアップロードした先生が採点
            gradedAt: new Date(),
          };
        }

        submissionData.push({
          homework: homeworkId,
          student: student._id,
          submittedFiles,
          submittedAt,
          submissionStatus,
          grade,
          isLocked: isGraded,
        });
      }
    }

    // データベースに挿入
    const result = await Submission.insertMany(submissionData);

    // 統計を計算（submissionStatusを使用）
    const submittedCount = submissionData.filter(
      (s) => s.submissionStatus === "submitted"
    ).length;
    const lateCount = submissionData.filter(
      (s) => s.submissionStatus === "late"
    ).length;
    const notSubmittedCount = students.length - submissionData.length;
    const gradedCount = submissionData.filter(
      (s) => s.grade.score !== null
    ).length;

    res.status(201).json({
      message: `Submission data generated for Division ${division}`,
      homeworkTitle: homework.title,
      dueDate: dueDate.toISOString().split("T")[0],
      totalGenerated: result.length,
      stats: {
        onTime: submittedCount,
        late: lateCount,
        notSubmitted: notSubmittedCount,
        graded: gradedCount,
        totalStudents: students.length,
      },
    });
  } catch (error) {
    console.error("Submission data generation error:", error);
    res.status(500);
    throw new Error("Failed to generate submission data");
  }
});

/**
 * @purpose 今週の5日分の出席率統計を取得
 * @route GET /api/attendance/weekly-stats
 * @access Private (teacher only)
 */
const getWeeklyAttendanceStats = async (req, res) => {
  try {
    const user = req.user;

    // 先生の認証チェック
    if (user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "先生のみアクセス可能です。",
      });
    }

    const teacherDivision = user.profile.division;
    // Week管理システムから動的取得
    const currentWeek = await getCurrentWeekNumber();

    console.log(
      `📊 週間出席統計を取得中 - Division: ${teacherDivision}, Week: ${currentWeek}`
    );

    // Week 39の全出席データを確認（デバッグ用）
    const allWeek39Attendance = await Attendance.find({ week: currentWeek });
    console.log(
      `🔍 Week ${currentWeek}の全出席データ数: ${allWeek39Attendance.length}`
    );

    // 日付別の出席データ数を確認
    const dateCounts = {};
    allWeek39Attendance.forEach((record) => {
      const dateStr = record.date.toISOString().split("T")[0];
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
    });
    console.log(`📅 日付別出席データ数:`, dateCounts);

    // 今週の出席データを取得（月曜日〜金曜日のみ）

    const weeklyStats = await Attendance.aggregate([
      {
        $match: {
          week: currentWeek,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "studentInfo",
        },
      },
      {
        $unwind: "$studentInfo",
      },
      {
        $match: {
          "studentInfo.profile.division": teacherDivision,
        },
      },
      {
        $addFields: {
          dateString: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
            },
          },
          // 日付のみで曜日を計算（時間を無視）
          dayOfWeek: {
            $dayOfWeek: {
              $dateFromString: {
                dateString: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$date",
                  },
                },
              },
            },
          },
        },
      },
      {
        $match: {
          dayOfWeek: { $gte: 2, $lte: 6 }, // 月曜日(2)から金曜日(6)のみ（日曜日=1, 土曜日=7を除外）
        },
      },
      {
        $group: {
          _id: "$dateString",
          date: { $first: "$date" },
          dayOfWeek: { $first: "$dayOfWeek" },
          totalStudents: { $sum: 1 },
          presentStudents: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
          },
          absentStudents: {
            $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
          },
          lateStudents: {
            $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] },
          },
        },
      },
      {
        $addFields: {
          attendanceRate: {
            $multiply: [
              { $divide: ["$presentStudents", "$totalStudents"] },
              100,
            ],
          },
        },
      },
      {
        $sort: { date: 1 }, // 日付順にソート
      },
    ]);

    // 日付を曜日付きで表示
    const formatDateToWeekday = (dateStr) => {
      const date = new Date(dateStr);
      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      // UTCで日付を取得して、タイムゾーンの問題を回避
      const month = date.getUTCMonth() + 1;
      const day = date.getUTCDate();
      const dayOfWeek = date.getUTCDay();
      return `${month}/${day}(${weekdays[dayOfWeek]})`;
    };

    // レスポンス用にデータを整形
    const formattedStats = weeklyStats.map((stat) => ({
      date: stat._id,
      displayDate: formatDateToWeekday(stat._id),
      totalStudents: stat.totalStudents,
      presentStudents: stat.presentStudents,
      absentStudents: stat.absentStudents,
      lateStudents: stat.lateStudents,
      attendanceRate: Math.round(stat.attendanceRate * 100) / 100, // 小数点2桁まで
      dayOfWeek: stat.dayOfWeek, // デバッグ用
    }));

    console.log(`📊 週間統計取得完了: ${formattedStats.length}日分のデータ`);
    formattedStats.forEach((day) => {
      console.log(
        `  ${day.displayDate}: ${day.attendanceRate}% (${day.presentStudents}/${day.totalStudents}) [曜日:${day.dayOfWeek}]`
      );
    });

    res.status(200).json({
      success: true,
      message: `Week ${currentWeek}の出席統計を取得しました`,
      data: {
        week: currentWeek,
        division: teacherDivision,
        dailyStats: formattedStats,
        summary: {
          totalDays: formattedStats.length,
          averageAttendanceRate:
            formattedStats.length > 0
              ? Math.round(
                  (formattedStats.reduce(
                    (sum, day) => sum + day.attendanceRate,
                    0
                  ) /
                    formattedStats.length) *
                    100
                ) / 100
              : 0,
        },
      },
    });
  } catch (error) {
    console.error("週間出席統計取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "週間出席統計の取得に失敗しました。",
      error: error.message,
    });
  }
};

export {
  generateAttendanceData,
  clearAllAttendanceData,
  generateSubmissionData,
  getWeeklyAttendanceStats,
};
