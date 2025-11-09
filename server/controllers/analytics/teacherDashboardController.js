/**
 * @purpose 教師ダッシュボード専用の軽量APIコントローラー
 * 各チャートコンポーネントが個別にデータを取得できるように最適化
 */

import asyncHandler from "express-async-handler";
import Homework from "../../models/homeworkModel.js";
import Submission from "../../models/submissionModel.js";
import User from "../../models/userModel.js";
import { getCurrentWeekNumber } from "../../utils/currentWeekUtils.js";

/**
 * 提出統計チャート専用API
 * @route GET /api/analytics/teacher/submission-stats-chart
 * @access Private (先生のみ)
 */
const getSubmissionStatsForChart = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role !== "teacher") {
    res.status(403);
    throw new Error("Forbidden: Only teachers can access this data.");
  }

  const teacherDivision = user.profile.division;
  if (!teacherDivision) {
    res.status(400);
    throw new Error("Teacher division not found in profile.");
  }

  try {
    // 現在の週を取得
    const currentWeekNumber = await getCurrentWeekNumber();
    const lastWeekNumber = currentWeekNumber - 1;

    // 先生のdivisionの生徒を取得
    const divisionStudents = await User.find({
      role: "student",
      "profile.division": teacherDivision,
    }).select("_id");

    const studentIds = divisionStudents.map((student) => student._id);

    // 今週と先週のホームワークを取得
    const currentWeekHomeworks = await Homework.find({
      uploadedBy: user._id,
      week: currentWeekNumber,
    }).populate("subject", "name");

    const lastWeekHomeworks = await Homework.find({
      uploadedBy: user._id,
      week: lastWeekNumber,
    }).populate("subject", "name");

    // 提出データを取得
    const currentWeekSubmissions = await Submission.find({
      homework: { $in: currentWeekHomeworks.map((hw) => hw._id) },
      student: { $in: studentIds },
    });

    const lastWeekSubmissions = await Submission.find({
      homework: { $in: lastWeekHomeworks.map((hw) => hw._id) },
      student: { $in: studentIds },
    });

    // 科目別統計を計算
    const calculateSubjectStats = (homeworks, submissions) => {
      const stats = {};

      homeworks.forEach((hw) => {
        const subjectName = hw.subject?.name || "Unknown";
        if (!stats[subjectName]) {
          stats[subjectName] = {
            totalHomeworks: 0,
            totalSubmissions: 0,
            totalPossibleSubmissions: 0,
          };
        }

        stats[subjectName].totalHomeworks++;
        stats[subjectName].totalPossibleSubmissions += studentIds.length;
      });

      submissions.forEach((sub) => {
        const hw = homeworks.find(
          (h) => h._id.toString() === sub.homework.toString()
        );
        if (hw) {
          const subjectName = hw.subject?.name || "Unknown";
          if (stats[subjectName]) {
            stats[subjectName].totalSubmissions++;
          }
        }
      });

      return Object.keys(stats).map((subjectName) => ({
        subjectName,
        submissionRate:
          stats[subjectName].totalPossibleSubmissions > 0
            ? Math.round(
                (stats[subjectName].totalSubmissions /
                  stats[subjectName].totalPossibleSubmissions) *
                  100
              )
            : 0,
        totalHomeworks: stats[subjectName].totalHomeworks,
        totalSubmissions: stats[subjectName].totalSubmissions,
      }));
    };

    const currentWeekStats = calculateSubjectStats(
      currentWeekHomeworks,
      currentWeekSubmissions
    );
    const lastWeekStats = calculateSubjectStats(
      lastWeekHomeworks,
      lastWeekSubmissions
    );

    res.status(200).json({
      success: true,
      data: {
        currentWeek: {
          weekNumber: currentWeekNumber,
          stats: currentWeekStats,
        },
        lastWeek: {
          weekNumber: lastWeekNumber,
          stats: lastWeekStats,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * 科目別コアコンピテンシーチャート専用API
 * @route GET /api/analytics/teacher/core-competencies-chart
 * @access Private (先生のみ)
 */
const getCoreCompetenciesForChart = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role !== "teacher") {
    res.status(403);
    throw new Error("Forbidden: Only teachers can access this data.");
  }

  const teacherDivision = user.profile.division;
  if (!teacherDivision) {
    res.status(400);
    throw new Error("Teacher division not found in profile.");
  }

  try {
    // 現在の週を取得
    const currentWeekNumber = await getCurrentWeekNumber();

    // 先生のdivisionの生徒を取得
    const divisionStudents = await User.find({
      role: "student",
      "profile.division": teacherDivision,
    }).select("_id");

    const studentIds = divisionStudents.map((student) => student._id);

    // 今週のホームワークと提出データを取得
    const currentWeekHomeworks = await Homework.find({
      uploadedBy: user._id,
      week: currentWeekNumber,
    }).populate("subject", "name");

    const submissions = await Submission.find({
      homework: { $in: currentWeekHomeworks.map((hw) => hw._id) },
      student: { $in: studentIds },
    }).populate({
      path: "homework",
      populate: {
        path: "subject",
        select: "name",
      },
    });

    // 科目別のコアコンピテンシー平均を計算
    const subjectCompetencies = {};

    console.log(`📊 提出データ数: ${submissions.length}`);

    submissions.forEach((sub) => {
      if (sub.grade?.rubricScores && sub.homework?.subject?.name) {
        const subjectName = sub.homework.subject.name;
        console.log(
          `📝 rubricScoresデータ: ${subjectName} -`,
          sub.grade.rubricScores
        );

        if (!subjectCompetencies[subjectName]) {
          subjectCompetencies[subjectName] = {
            communication: [],
            creativeThinking: [],
            criticalThinking: [],
            identity: [],
            responsibility: [],
            socialResponsibility: [],
          };
        }

        Object.keys(sub.grade.rubricScores).forEach((key) => {
          if (
            sub.grade.rubricScores[key] !== null &&
            sub.grade.rubricScores[key] !== undefined
          ) {
            subjectCompetencies[subjectName][key].push(
              sub.grade.rubricScores[key]
            );
          }
        });
      } else {
        console.log(
          `⚠️ rubricScoresなし: ${sub.homework?.subject?.name} - grade: ${sub.grade}, rubricScores: ${sub.grade?.rubricScores}`
        );
      }
    });

    // 平均値を計算
    const result = Object.keys(subjectCompetencies).map((subjectName) => {
      const averages = {};
      Object.keys(subjectCompetencies[subjectName]).forEach((key) => {
        const scores = subjectCompetencies[subjectName][key];
        averages[key] =
          scores.length > 0
            ? Math.round(
                (scores.reduce((sum, score) => sum + score, 0) /
                  scores.length) *
                  100
              ) / 100
            : 0;
      });

      return {
        subjectName,
        averages,
      };
    });

    console.log(
      `📊 コアコンピテンシーチャートデータ取得完了 - 科目数: ${result.length}`
    );

    res.status(200).json({
      success: true,
      data: {
        weekNumber: currentWeekNumber,
        subjects: result,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * 科目別バーチャート専用API
 * @route GET /api/analytics/teacher/subject-bar-chart
 * @access Private (先生のみ)
 */
const getSubjectBarChartData = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role !== "teacher") {
    res.status(403);
    throw new Error("Forbidden: Only teachers can access this data.");
  }

  const teacherDivision = user.profile.division;
  if (!teacherDivision) {
    res.status(400);
    throw new Error("Teacher division not found in profile.");
  }

  try {
    // 現在の週を取得
    const currentWeekNumber = await getCurrentWeekNumber();
    const lastWeekNumber = currentWeekNumber - 1;

    // 先生のdivisionの生徒を取得
    const divisionStudents = await User.find({
      role: "student",
      "profile.division": teacherDivision,
    }).select("_id");

    const studentIds = divisionStudents.map((student) => student._id);

    // 今週と先週のホームワークを取得
    const currentWeekHomeworks = await Homework.find({
      uploadedBy: user._id,
      week: currentWeekNumber,
    }).populate("subject", "name");

    const lastWeekHomeworks = await Homework.find({
      uploadedBy: user._id,
      week: lastWeekNumber,
    }).populate("subject", "name");

    // 今週と先週の提出データを取得
    const currentWeekSubmissions = await Submission.find({
      homework: { $in: currentWeekHomeworks.map((hw) => hw._id) },
      student: { $in: studentIds },
    }).populate("homework");

    const lastWeekSubmissions = await Submission.find({
      homework: { $in: lastWeekHomeworks.map((hw) => hw._id) },
      student: { $in: studentIds },
    }).populate("homework");

    // 科目別統計を計算する関数
    const calculateSubjectStats = (homeworks, submissions) => {
      const stats = {};

      homeworks.forEach((hw) => {
        const subjectName = hw.subject?.name || "Unknown";
        if (!stats[subjectName]) {
          stats[subjectName] = {
            totalHomeworks: 0,
            totalPossibleSubmissions: 0,
            totalSubmissions: 0,
            totalGrades: 0,
            submissionCount: 0,
          };
        }
        stats[subjectName].totalHomeworks++;
        stats[subjectName].totalPossibleSubmissions += studentIds.length;
      });

      submissions.forEach((sub) => {
        const hw = homeworks.find(
          (h) => h._id.toString() === sub.homework._id.toString()
        );
        if (hw) {
          const subjectName = hw.subject?.name || "Unknown";
          if (stats[subjectName]) {
            stats[subjectName].totalSubmissions++;
            if (sub.grade?.letterGrade) {
              stats[subjectName].totalGrades += sub.grade.letterGrade;
              stats[subjectName].submissionCount++;
            }
          }
        }
      });

      return Object.keys(stats).map((subjectName) => {
        const subjectStats = stats[subjectName];
        return {
          subjectName,
          submissionRate:
            subjectStats.totalPossibleSubmissions > 0
              ? Math.round(
                  (subjectStats.totalSubmissions /
                    subjectStats.totalPossibleSubmissions) *
                    100
                )
              : 0,
          averageGrade:
            subjectStats.submissionCount > 0
              ? Math.round(
                  (subjectStats.totalGrades / subjectStats.submissionCount) *
                    100
                ) / 100
              : 0,
          totalHomeworks: subjectStats.totalHomeworks,
          totalSubmissions: subjectStats.totalSubmissions,
        };
      });
    };

    const currentWeekStats = calculateSubjectStats(
      currentWeekHomeworks,
      currentWeekSubmissions
    );
    const lastWeekStats = calculateSubjectStats(
      lastWeekHomeworks,
      lastWeekSubmissions
    );

    res.status(200).json({
      success: true,
      data: {
        currentWeek: {
          weekNumber: currentWeekNumber,
          stats: currentWeekStats,
        },
        lastWeek: {
          weekNumber: lastWeekNumber,
          stats: lastWeekStats,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * 科目別ドーナツチャート専用API
 * @route GET /api/analytics/teacher/subject-donut-chart
 * @access Private (先生のみ)
 */
const getSubjectDonutChartData = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role !== "teacher") {
    res.status(403);
    throw new Error("Forbidden: Only teachers can access this data.");
  }

  const teacherDivision = user.profile.division;
  if (!teacherDivision) {
    res.status(400);
    throw new Error("Teacher division not found in profile.");
  }

  try {
    // 現在の週を取得
    const currentWeekNumber = await getCurrentWeekNumber();

    // 先生のdivisionの生徒を取得
    const divisionStudents = await User.find({
      role: "student",
      "profile.division": teacherDivision,
    }).select("_id");

    const studentIds = divisionStudents.map((student) => student._id);

    // 今週のホームワークと提出データを取得
    const currentWeekHomeworks = await Homework.find({
      uploadedBy: user._id,
      week: currentWeekNumber,
    }).populate("subject", "name");

    const submissions = await Submission.find({
      homework: { $in: currentWeekHomeworks.map((hw) => hw._id) },
      student: { $in: studentIds },
    }).populate("homework");

    // 科目別の成績評価レベルを計算
    const subjectStats = {};

    console.log(`📊 提出データ数: ${submissions.length}`);

    currentWeekHomeworks.forEach((hw) => {
      const subjectName = hw.subject?.name || "Unknown";
      if (!subjectStats[subjectName]) {
        subjectStats[subjectName] = {
          Emerging: 0,
          Developing: 0,
          Proficient: 0,
          Extending: 0,
        };
      }
    });

    submissions.forEach((sub) => {
      const hw = currentWeekHomeworks.find(
        (h) => h._id.toString() === sub.homework._id.toString()
      );

      if (hw && sub.grade?.letterGrade) {
        const subjectName = hw.subject?.name || "Unknown";
        if (
          subjectStats[subjectName] &&
          subjectStats[subjectName].hasOwnProperty(sub.grade.letterGrade)
        ) {
          subjectStats[subjectName][sub.grade.letterGrade]++;
        }
      }
    });

    const result = Object.keys(subjectStats).map((subjectName) => {
      const stats = subjectStats[subjectName];
      const subjectResult = {
        subjectName,
        Emerging: stats.Emerging,
        Developing: stats.Developing,
        Proficient: stats.Proficient,
        Extending: stats.Extending,
      };
      console.log(`📊 ${subjectName}の成績統計:`, subjectResult);
      return subjectResult;
    });

    console.log(
      `📊 科目別ドーナツチャートデータ取得完了 - 科目数: ${result.length}`
    );

    res.status(200).json({
      success: true,
      data: {
        weekNumber: currentWeekNumber,
        subjects: result,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

export {
  getSubmissionStatsForChart,
  getCoreCompetenciesForChart,
  getSubjectBarChartData,
  getSubjectDonutChartData,
};
