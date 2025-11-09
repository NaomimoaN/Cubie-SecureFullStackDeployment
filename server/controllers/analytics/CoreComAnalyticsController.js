/**
 * @purpose Core Competencies（中核的能力）分析専用コントローラー
 * Week別のrubric scores統計、提出状況分析などの機能を提供
 */

import asyncHandler from "express-async-handler";
import Homework from "../../models/homeworkModel.js";
import Submission from "../../models/submissionModel.js";
import User from "../../models/userModel.js";
import { getCurrentWeekNumber } from "../../utils/currentWeekUtils.js";

/**
 * @purpose Week 39のホームワークのrubric scores平均値を取得
 * @route GET /api/analytics/homework/week39-rubric-averages
 * @access Private (teacher only)
 */
const getWeek39RubricAverages = asyncHandler(async (req, res) => {
  try {
    const user = req.user;

    // 先生の認証チェック
    if (user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "先生のみアクセス可能です。",
      });
    }

    console.log("📊 Week 39のrubric scores平均値を計算中...");

    // Step 1: 教師が担当する科目のホームワークデータを取得
    const teacher = await User.findById(user._id).populate("assignedSubjects");

    if (
      !teacher ||
      !teacher.assignedSubjects ||
      teacher.assignedSubjects.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "担当科目が見つかりません。",
        data: {
          week: null,
          homeworkCount: 0,
          submissionCount: 0,
        },
      });
    }

    const assignedSubjectIds = teacher.assignedSubjects.map(
      (subject) => subject._id
    );
    console.log("📚 教師の担当科目:", assignedSubjectIds);

    // 教師が担当する科目のホームワークのみを取得
    const allHomeworks = await Homework.find({
      subject: { $in: assignedSubjectIds },
    })
      .select("week title subject")
      .sort({ week: -1 })
      .limit(20);

    console.log("📋 全ホームワークのweekフィールド確認 (最大20件):");
    allHomeworks.forEach((hw) => {
      console.log(
        `  - Week: ${hw.week} (型: ${typeof hw.week}) | Title: ${
          hw.title
        } | Subject: ${hw.subject}`
      );
    });

    // 最新の週番号を取得（データが存在する週）
    const latestWeek = allHomeworks.length > 0 ? allHomeworks[0].week : null;

    // AcademicWeekから現在の週を取得（フォールバック用）
    const academicCurrentWeek = await getCurrentWeekNumber();

    // 実際のデータがある週を優先、なければAcademicWeekの週を使用
    const currentWeek = latestWeek || academicCurrentWeek;

    console.log(
      `🔍 検索条件: { week: ${currentWeek} } (AcademicWeek: ${academicCurrentWeek}, Latest data week: ${latestWeek})`
    );

    const currentWeekHomeworks = await Homework.find({ week: currentWeek });

    // デバッグ用: 全てのホームワークのweekフィールドを確認
    if (currentWeekHomeworks.length === 0) {
      console.log(
        `⚠️ Week ${currentWeek}で見つかりませんでした。他のweek値を確認中...`
      );
      const allHomeworks = await Homework.find({})
        .select("week title")
        .limit(10);
      console.log("📋 既存のホームワークのweek値 (最大10件):");
      allHomeworks.forEach((hw) => {
        console.log(
          `  - Week: ${hw.week} (型: ${typeof hw.week}) | Title: ${hw.title}`
        );
      });
    }

    if (currentWeekHomeworks.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Week ${currentWeek}のホームワークが見つかりません。`,
        data: {
          week: currentWeek,
          homeworkCount: 0,
          submissionCount: 0,
        },
      });
    }

    console.log(
      `📚 Week ${currentWeek}のホームワーク: ${currentWeekHomeworks.length}件見つかりました`
    );
    currentWeekHomeworks.forEach((hw) => {
      console.log(`  - ${hw.title} (ID: ${hw._id})`);
    });

    console.log(`👥 教師の担当生徒: ${assignedStudentIds.length}人`);
    if (assignedStudentIds.length > 0) {
      console.log("担当生徒ID:", assignedStudentIds);
    }

    // Step 2: 現在の週のホームワークIDリストを作成
    const homeworkIds = currentWeekHomeworks.map((hw) => hw._id);

    // Step 3: 教師が担当する生徒の提出物のみを取得
    const assignedStudentIds = teacher.assignedStudents || [];
    console.log("👥 教師の担当生徒数:", assignedStudentIds.length);

    let submissionQuery = {
      homework: { $in: homeworkIds },
      "grade.score": { $ne: null }, // 採点済みのもののみ
    };

    // 担当生徒がいる場合は、その生徒の提出物のみを取得
    if (assignedStudentIds.length > 0) {
      submissionQuery.student = { $in: assignedStudentIds };
    }

    const submissions = await Submission.find(submissionQuery)
      .select("homework grade student submittedAt")
      .populate("student", "profile.firstName profile.lastName");

    if (submissions.length === 0) {
      return res.status(200).json({
        success: true,
        message: `Week ${currentWeek}のホームワークに対する採点済み提出物が見つかりません。`,
        data: {
          week: currentWeek,
          homeworkCount: currentWeekHomeworks.length,
          submissionCount: 0,
          coreCompetencyAverages: {},
          coreCompetencyCounts: {},
          overallAverage: null,
        },
      });
    }

    console.log(`📝 採点済み提出物: ${submissions.length}件見つかりました`);

    // Step 4: 6つのCore Competencies（中核的能力）の平均値を計算
    const coreCompetencies = [
      "communication",
      "creativeThinking",
      "criticalThinking",
      "identity",
      "responsibility",
      "socialResponsibility",
    ];

    const competencyAverages = {};
    const competencyCounts = {};

    // 各能力の初期化
    coreCompetencies.forEach((competency) => {
      competencyAverages[competency] = 0;
      competencyCounts[competency] = 0;
    });

    // 全提出物のCore Competenciesスコアを集計
    submissions.forEach((submission) => {
      const grade = submission.grade;

      // rubricScoresに直接アクセス
      if (grade && grade.rubricScores) {
        const rubricScores = grade.rubricScores;

        coreCompetencies.forEach((competency) => {
          const score = rubricScores[competency];

          if (score !== null && score !== undefined && !isNaN(score)) {
            competencyAverages[competency] += score;
            competencyCounts[competency]++;
          }
        });
      }
    });

    // 平均値を計算
    const finalAverages = {};
    coreCompetencies.forEach((competency) => {
      if (competencyCounts[competency] > 0) {
        finalAverages[competency] =
          Math.round(
            (competencyAverages[competency] / competencyCounts[competency]) *
              100
          ) / 100;
      } else {
        finalAverages[competency] = null;
      }
    });

    // 全体の平均値も計算
    const validAverages = Object.values(finalAverages).filter(
      (avg) => avg !== null
    );
    const overallAverage =
      validAverages.length > 0
        ? Math.round(
            (validAverages.reduce((sum, avg) => sum + avg, 0) /
              validAverages.length) *
              100
          ) / 100
        : null;

    console.log("📊 Core Competencies平均値計算完了:");
    coreCompetencies.forEach((competency) => {
      console.log(
        `  ${competency}: ${finalAverages[competency]} (${competencyCounts[competency]}件)`
      );
    });
    console.log(`  全体平均: ${overallAverage}`);

    res.status(200).json({
      success: true,
      message: `Week ${currentWeek}のCore Competencies平均値を取得しました。`,
      data: {
        week: currentWeek,
        homeworkCount: currentWeekHomeworks.length,
        submissionCount: submissions.length,
        homeworks: currentWeekHomeworks.map((hw) => ({
          id: hw._id,
          title: hw.title,
          subject: hw.subject,
        })),
        coreCompetencyAverages: finalAverages,
        coreCompetencyCounts: competencyCounts,
        overallAverage: overallAverage,
        calculation: {
          totalSubmissions: submissions.length,
          gradedSubmissions: submissions.filter((s) => s.grade?.score !== null)
            .length,
        },
      },
    });
  } catch (error) {
    console.error("Week 39 Core Competencies平均値取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "Core Competencies平均値の取得に失敗しました。",
      error: error.message,
    });
  }
});

/**
 * @purpose 指定されたWeekのホームワークのCore Competencies平均値を取得（汎用版）
 * @route GET /api/analytics/homework/week/:week/rubric-averages
 * @access Private (teacher only)
 */
const getWeekRubricAverages = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    const { week } = req.params;

    // 先生の認証チェック
    if (user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "先生のみアクセス可能です。",
      });
    }

    const weekNum = parseInt(week);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 40) {
      return res.status(400).json({
        success: false,
        message: "有効なweek番号（1-40）を指定してください。",
      });
    }

    console.log(`📊 Week ${weekNum}のCore Competencies平均値を計算中...`);

    // 教師が担当する科目のホームワークデータを取得
    const teacher = await User.findById(user._id).populate("assignedSubjects");

    if (
      !teacher ||
      !teacher.assignedSubjects ||
      teacher.assignedSubjects.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "担当科目が見つかりません。",
        data: {
          week: weekNum,
          homeworkCount: 0,
          submissionCount: 0,
        },
      });
    }

    const assignedSubjectIds = teacher.assignedSubjects.map(
      (subject) => subject._id
    );
    console.log("📚 教師の担当科目:", assignedSubjectIds);

    // 教師が担当する科目のホームワークのみを取得
    console.log(
      `🔍 検索条件: { week: ${weekNum}, subject: { $in: assignedSubjectIds } }`
    );
    const weekHomeworks = await Homework.find({
      week: weekNum,
      subject: { $in: assignedSubjectIds },
    });

    if (weekHomeworks.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Week ${weekNum}のホームワークが見つかりません。`,
        data: {
          week: weekNum,
          homeworkCount: 0,
          submissionCount: 0,
        },
      });
    }

    // ホームワークIDリストを作成
    const homeworkIds = weekHomeworks.map((hw) => hw._id);

    // 教師が担当する生徒の提出物のみを取得
    const assignedStudentIds = teacher.assignedStudents || [];
    console.log("👥 教師の担当生徒数:", assignedStudentIds.length);

    let submissionQuery = {
      homework: { $in: homeworkIds },
      "grade.score": { $ne: null }, // 採点済みのもののみ
    };

    // 担当生徒がいる場合は、その生徒の提出物のみを取得
    if (assignedStudentIds.length > 0) {
      submissionQuery.student = { $in: assignedStudentIds };
    }

    const submissions = await Submission.find(submissionQuery)
      .select("homework grade student submittedAt")
      .populate("student", "profile.firstName profile.lastName");

    if (submissions.length === 0) {
      return res.status(200).json({
        success: true,
        message: `Week ${weekNum}のホームワークに対する採点済み提出物が見つかりません。`,
        data: {
          week: weekNum,
          homeworkCount: weekHomeworks.length,
          submissionCount: 0,
          coreCompetencyAverages: {},
          coreCompetencyCounts: {},
          overallAverage: null,
        },
      });
    }

    // Core Competenciesの平均値を計算
    const coreCompetencies = [
      "communication",
      "creativeThinking",
      "criticalThinking",
      "identity",
      "responsibility",
      "socialResponsibility",
    ];

    const competencyAverages = {};
    const competencyCounts = {};

    coreCompetencies.forEach((competency) => {
      competencyAverages[competency] = 0;
      competencyCounts[competency] = 0;
    });

    submissions.forEach((submission) => {
      const rubricScores = submission.grade?.rubricScores;

      if (rubricScores) {
        coreCompetencies.forEach((competency) => {
          const score = rubricScores[competency];
          if (score !== null && score !== undefined && !isNaN(score)) {
            competencyAverages[competency] += score;
            competencyCounts[competency]++;
          }
        });
      }
    });

    const finalAverages = {};
    coreCompetencies.forEach((competency) => {
      if (competencyCounts[competency] > 0) {
        finalAverages[competency] =
          Math.round(
            (competencyAverages[competency] / competencyCounts[competency]) *
              100
          ) / 100;
      } else {
        finalAverages[competency] = null;
      }
    });

    const validAverages = Object.values(finalAverages).filter(
      (avg) => avg !== null
    );
    const overallAverage =
      validAverages.length > 0
        ? Math.round(
            (validAverages.reduce((sum, avg) => sum + avg, 0) /
              validAverages.length) *
              100
          ) / 100
        : null;

    res.status(200).json({
      success: true,
      message: `Week ${weekNum}のCore Competencies平均値を取得しました。`,
      data: {
        week: weekNum,
        homeworkCount: weekHomeworks.length,
        submissionCount: submissions.length,
        homeworks: weekHomeworks.map((hw) => ({
          id: hw._id,
          title: hw.title,
          subject: hw.subject,
        })),
        coreCompetencyAverages: finalAverages,
        coreCompetencyCounts: competencyCounts,
        overallAverage: overallAverage,
        calculation: {
          totalSubmissions: submissions.length,
          gradedSubmissions: submissions.filter((s) => s.grade?.score !== null)
            .length,
        },
      },
    });
  } catch (error) {
    console.error(`Week ${weekNum} Core Competencies平均値取得エラー:`, error);
    res.status(500).json({
      success: false,
      message: "Core Competencies平均値の取得に失敗しました。",
      error: error.message,
    });
  }
});

export { getWeek39RubricAverages, getWeekRubricAverages };
