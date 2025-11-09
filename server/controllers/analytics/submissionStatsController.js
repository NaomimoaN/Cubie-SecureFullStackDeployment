/**
 * @purpose ログインした先生のdivisionの提出統計とレポート機能を管理
 * ホームワークの提出率、科目別統計、週次レポートなどを提供
 */

import asyncHandler from "express-async-handler";
import Homework from "../../models/homeworkModel.js";
import Submission from "../../models/submissionModel.js";
import User from "../../models/userModel.js";
import { getCurrentWeekNumber } from "../../utils/currentWeekUtils.js";

/**
 * @purpose ログインした先生のdivision専用：今週と先週のホームワーク提出率を科目ごとに取得
 * @route GET /api/analytics/division14/submission-stats
 * @access Private (先生のみ、自分のdivisionのデータのみ)
 */

// ログインした先生のdivision専用：今週と先週のホームワーク提出率を科目ごとに取得+LetterGradeの平均値を取得
const getDivisionSubmissionStats = asyncHandler(async (req, res) => {
  const user = req.user;

  // 先生かどうかチェック
  if (user.role !== "teacher") {
    return res
      .status(403)
      .json({ message: "Forbidden: Only teachers can access this data." });
  }

  // ログインユーザーのdivisionを取得
  const teacherDivision = user.profile.division;

  if (!teacherDivision) {
    return res
      .status(400)
      .json({ message: "Teacher division not found in profile." });
  }

  // ログインした先生のdivisionの生徒を取得
  const divisionStudents = await User.find({
    role: "student",
    "profile.division": teacherDivision,
  }).select("_id");

  const studentIds = divisionStudents.map((student) => student._id);

  // 先生が作成した全てのホームワークを取得して最新の配布日を特定
  const allTeacherHomeworks = await Homework.find({
    uploadedBy: user._id,
  }).populate("subject", "name");

  if (allTeacherHomeworks.length === 0) {
    return res
      .status(404)
      .json({ message: "No homeworks found for this teacher." });
  }

  // データベースにある実際のweek値を確認
  const weekValues = allTeacherHomeworks
    .map((hw) => hw.week)
    .filter((week) => week !== null && week !== undefined);
  const uniqueWeeks = [...new Set(weekValues)].sort((a, b) => b - a);

  // 科目別のweek分布を確認
  const subjectWeekMap = {};
  allTeacherHomeworks.forEach((hw) => {
    const subject = hw.subject?.name || "Unknown";
    if (!subjectWeekMap[subject]) {
      subjectWeekMap[subject] = [];
    }
    if (hw.week) {
      subjectWeekMap[subject].push(hw.week);
    }
  });

  // 最新のホームワーク配布日を取得
  const validDates = allTeacherHomeworks
    .map((hw) => hw.assignedDate || hw.createdAt)
    .filter((date) => date && !isNaN(new Date(date).getTime()))
    .map((date) => new Date(date));

  if (validDates.length === 0) {
    return res
      .status(400)
      .json({ message: "No valid dates found in homework data." });
  }

  const latestHomeworkDate = new Date(Math.max(...validDates));

  // 最新のホームワークの詳細を取得（weekフィールドを含む）
  const latestHomework = allTeacherHomeworks.find((hw) => {
    const hwDate = new Date(hw.assignedDate || hw.createdAt);
    return hwDate.getTime() === latestHomeworkDate.getTime();
  });

  // 現在の週をWeek管理システムから動的に取得
  let currentWeekNumber, lastWeekNumber;

  // Week管理システムから現在の週を取得
  currentWeekNumber = await getCurrentWeekNumber();

  // 先週は現在の週の前の週
  lastWeekNumber = currentWeekNumber - 1;

  // 先週のデータが存在しない場合は、データベースの最新週を使用
  if (!uniqueWeeks.includes(lastWeekNumber) && uniqueWeeks.length > 0) {
    lastWeekNumber = uniqueWeeks[0];
  }

  // 各科目別に今週と先週のホームワークを取得
  const allSubjectsInTeacherHomeworks = [
    ...new Set(
      allTeacherHomeworks.map((hw) => hw.subject?.name).filter((name) => name)
    ),
  ];

  // 科目別に今週と先週のホームワークを分類
  const currentWeekHomeworksBySubject = {};
  const lastWeekHomeworksBySubject = {};

  allSubjectsInTeacherHomeworks.forEach((subject) => {
    currentWeekHomeworksBySubject[subject] = allTeacherHomeworks.filter(
      (hw) => hw.subject?.name === subject && hw.week === currentWeekNumber
    );
    lastWeekHomeworksBySubject[subject] = allTeacherHomeworks.filter(
      (hw) => hw.subject?.name === subject && hw.week === lastWeekNumber
    );
  });

  // 各科目の週別ホームワーク数をログ出力
  allSubjectsInTeacherHomeworks.forEach((subject) => {
    const currentCount = currentWeekHomeworksBySubject[subject].length;
    const lastCount = lastWeekHomeworksBySubject[subject].length;
  });

  // 全体の今週と先週のホームワークリストを作成
  const currentWeekHomeworks = Object.values(
    currentWeekHomeworksBySubject
  ).flat();
  const lastWeekHomeworks = Object.values(lastWeekHomeworksBySubject).flat();

  // 提出率計算関数
  const calculateSubmissionStats = async (homeworks, weekLabel) => {
    try {
      const statsBySubject = {};

      // 全ての科目を初期化（両方の週で全科目を確保するため）
      const allSubjectsInTeacherHomeworks = [
        ...new Set(
          allTeacherHomeworks
            .map((hw) => hw.subject?.name)
            .filter((name) => name)
        ),
      ];

      allSubjectsInTeacherHomeworks.forEach((subjectName) => {
        statsBySubject[subjectName] = {
          subjectName,
          totalHomeworks: 0,
          totalPossibleSubmissions: 0,
          totalSubmissions: 0,
          totalOnTimeSubmissions: 0,
          totalLateSubmissions: 0,
          homeworkDetails: [],
          weeklyGrades: [], // 週次成績データを追加
        };
      });

      // 週番号を取得（weekLabelから抽出）
      const weekNumber = weekLabel.includes(`Week ${currentWeekNumber}`)
        ? currentWeekNumber
        : lastWeekNumber;

      // 各科目の週次成績データを初期化
      allSubjectsInTeacherHomeworks.forEach((subjectName) => {
        const subjectHomeworks = homeworks.filter(
          (hw) => hw.subject?.name === subjectName
        );

        if (subjectHomeworks.length > 0) {
          statsBySubject[subjectName].weeklyGrades.push({
            week: weekNumber,
            grades: [], // この週の全ての成績データ
          });
        }
      });

      for (const homework of homeworks) {
        const subjectName = homework.subject?.name || "Unknown Subject";

        // 科目が初期化されていない場合（念のため）
        if (!statsBySubject[subjectName]) {
          statsBySubject[subjectName] = {
            subjectName,
            totalHomeworks: 0,
            totalPossibleSubmissions: 0,
            totalSubmissions: 0,
            totalOnTimeSubmissions: 0,
            totalLateSubmissions: 0,
            homeworkDetails: [],
            weeklyGrades: [
              {
                week: weekNumber,
                grades: [],
              },
            ],
          };
        }

        // このホームワークの提出状況を取得（先生のdivisionの生徒のみ）
        const submissions = await Submission.find({
          homework: homework._id,
          student: { $in: studentIds },
        }).populate("student", "profile.firstName profile.lastName");

        const onTimeSubmissions = submissions.filter(
          (sub) => sub.submissionStatus === "submitted"
        ).length;

        const lateSubmissions = submissions.filter(
          (sub) => sub.submissionStatus === "late"
        ).length;

        const totalSubmissions = submissions.length;
        const possibleSubmissions = studentIds.length;
        const submissionRate =
          possibleSubmissions > 0
            ? ((totalSubmissions / possibleSubmissions) * 100).toFixed(1)
            : "0.0";

        // 成績データを週次成績に追加
        const weeklyGradeEntry = statsBySubject[subjectName].weeklyGrades.find(
          (wg) => wg.week === weekNumber
        );

        if (weeklyGradeEntry) {
          // 各提出物の成績データを追加
          submissions.forEach((submission) => {
            if (
              submission.grade &&
              (submission.grade.score !== null || submission.grade.letterGrade)
            ) {
              weeklyGradeEntry.grades.push({
                studentId: submission.student._id,
                studentName: `${submission.student.profile?.firstName || ""} ${
                  submission.student.profile?.lastName || ""
                }`.trim(),
                homeworkId: homework._id,
                homeworkTitle: homework.title,
                numericGrade: submission.grade.score || 0,
                letterGrade: submission.grade.letterGrade || null,
                rubricScores: submission.grade.rubricScores || null,
                gradedAt: submission.grade.gradedAt,
                submittedAt: submission.submittedAt,
                submissionStatus: submission.submissionStatus,
              });
            }
          });
        }

        // 科目別統計を更新
        statsBySubject[subjectName].totalHomeworks += 1;
        statsBySubject[subjectName].totalPossibleSubmissions +=
          possibleSubmissions;
        statsBySubject[subjectName].totalSubmissions += totalSubmissions;
        statsBySubject[subjectName].totalOnTimeSubmissions += onTimeSubmissions;
        statsBySubject[subjectName].totalLateSubmissions += lateSubmissions;

        // ホームワーク詳細を追加
        const assignedDate = homework.assignedDate || homework.createdAt;
        const safeAssignedDate =
          assignedDate && !isNaN(new Date(assignedDate).getTime())
            ? assignedDate
            : null;

        statsBySubject[subjectName].homeworkDetails.push({
          homeworkId: homework._id,
          title: homework.title,
          assignedDate: safeAssignedDate,
          dueDate: homework.dueDate,
          possibleSubmissions,
          totalSubmissions,
          onTimeSubmissions,
          lateSubmissions,
          submissionRate: `${submissionRate}%`,
        });
      }

      // 科目別の全体提出率を計算
      Object.keys(statsBySubject).forEach((subjectName) => {
        const stats = statsBySubject[subjectName];
        stats.overallSubmissionRate =
          stats.totalPossibleSubmissions > 0
            ? `${(
                (stats.totalSubmissions / stats.totalPossibleSubmissions) *
                100
              ).toFixed(1)}%`
            : "0.0%";
        stats.onTimeRate =
          stats.totalSubmissions > 0
            ? `${(
                (stats.totalOnTimeSubmissions / stats.totalSubmissions) *
                100
              ).toFixed(1)}%`
            : "0.0%";
        stats.lateRate =
          stats.totalSubmissions > 0
            ? `${(
                (stats.totalLateSubmissions / stats.totalSubmissions) *
                100
              ).toFixed(1)}%`
            : "0.0%";

        // 週次成績統計を計算
        stats.weeklyGrades.forEach((weeklyGrade) => {
          const grades = weeklyGrade.grades;
          const gradeCounts = {
            Emerging: grades.filter((g) => g.letterGrade === "Emerging").length,
            Developing: grades.filter((g) => g.letterGrade === "Developing")
              .length,
            Proficient: grades.filter((g) => g.letterGrade === "Proficient")
              .length,
            Extending: grades.filter((g) => g.letterGrade === "Extending")
              .length,
          };

          const numericGrades = grades
            .filter((g) => g.numericGrade > 0)
            .map((g) => g.numericGrade);
          const averageNumericGrade =
            numericGrades.length > 0
              ? (
                  numericGrades.reduce((sum, grade) => sum + grade, 0) /
                  numericGrades.length
                ).toFixed(1)
              : 0;

          // rubricScores平均計算を追加
          const rubricScoresData = grades
            .filter((g) => g.rubricScores)
            .map((g) => g.rubricScores);

          let averageRubricScores = null;
          if (rubricScoresData.length > 0) {
            const rubricKeys = [
              "communication",
              "creativeThinking",
              "criticalThinking",
              "identity",
              "responsibility",
              "socialResponsibility",
            ];
            averageRubricScores = {};

            rubricKeys.forEach((key) => {
              const scores = rubricScoresData
                .filter(
                  (rubric) => rubric[key] !== null && rubric[key] !== undefined
                )
                .map((rubric) => rubric[key]);

              if (scores.length > 0) {
                averageRubricScores[key] = parseFloat(
                  (
                    scores.reduce((sum, score) => sum + score, 0) /
                    scores.length
                  ).toFixed(1)
                );
              } else {
                averageRubricScores[key] = 0;
              }
            });

            // rubricScores統計情報も追加
            averageRubricScores.totalStudentsWithRubricScores =
              rubricScoresData.length;
            averageRubricScores.totalPossibleStudents = studentIds.length;
            averageRubricScores.rubricCoverageRate = parseFloat(
              ((rubricScoresData.length / studentIds.length) * 100).toFixed(1)
            );
          }

          weeklyGrade.summary = {
            totalGraded: grades.length,
            averageNumericGrade: parseFloat(averageNumericGrade),
            letterGradeDistribution: gradeCounts,
            gradedHomeworks: [...new Set(grades.map((g) => g.homeworkTitle))],
            averageRubricScores: averageRubricScores, // rubricScores平均を追加
          };
        });

        // 科目別のrubricScores統計を計算（全ての週を通じて）
        const allSubjectGrades = stats.weeklyGrades.flatMap((wg) => wg.grades);
        const allSubjectRubricScores = allSubjectGrades
          .filter((g) => g.rubricScores)
          .map((g) => g.rubricScores);

        let subjectRubricScoresSummary = null;
        if (allSubjectRubricScores.length > 0) {
          const rubricKeys = [
            "communication",
            "creativeThinking",
            "criticalThinking",
            "identity",
            "responsibility",
            "socialResponsibility",
          ];

          subjectRubricScoresSummary = {
            subjectName: subjectName,
            weekNumber: weekNumber,
            averageScores: {},
            scoreDistribution: {},
            performanceAnalysis: {},
          };

          rubricKeys.forEach((key) => {
            const scores = allSubjectRubricScores
              .filter(
                (rubric) => rubric[key] !== null && rubric[key] !== undefined
              )
              .map((rubric) => rubric[key]);

            if (scores.length > 0) {
              // 平均スコア
              const average = parseFloat(
                (
                  scores.reduce((sum, score) => sum + score, 0) / scores.length
                ).toFixed(1)
              );

              // スコア分布（10点刻み）
              const distribution = {
                "0-19": scores.filter((s) => s >= 0 && s < 20).length,
                "20-39": scores.filter((s) => s >= 20 && s < 40).length,
                "40-59": scores.filter((s) => s >= 40 && s < 60).length,
                "60-79": scores.filter((s) => s >= 60 && s < 80).length,
                "80-100": scores.filter((s) => s >= 80 && s <= 100).length,
              };

              // パフォーマンス分析
              const minScore = Math.min(...scores);
              const maxScore = Math.max(...scores);
              const highPerformers = scores.filter((s) => s >= 80).length;
              const lowPerformers = scores.filter((s) => s < 40).length;

              subjectRubricScoresSummary.averageScores[key] = average;
              subjectRubricScoresSummary.scoreDistribution[key] = distribution;
              subjectRubricScoresSummary.performanceAnalysis[key] = {
                min: minScore,
                max: maxScore,
                range: maxScore - minScore,
                highPerformers: highPerformers,
                lowPerformers: lowPerformers,
                totalStudents: scores.length,
                highPerformerRate: parseFloat(
                  ((highPerformers / scores.length) * 100).toFixed(1)
                ),
                lowPerformerRate: parseFloat(
                  ((lowPerformers / scores.length) * 100).toFixed(1)
                ),
              };
            } else {
              subjectRubricScoresSummary.averageScores[key] = 0;
              subjectRubricScoresSummary.scoreDistribution[key] = {
                "0-19": 0,
                "20-39": 0,
                "40-59": 0,
                "60-79": 0,
                "80-100": 0,
              };
              subjectRubricScoresSummary.performanceAnalysis[key] = {
                min: 0,
                max: 0,
                range: 0,
                highPerformers: 0,
                lowPerformers: 0,
                totalStudents: 0,
                highPerformerRate: 0,
                lowPerformerRate: 0,
              };
            }
          });

          // 科目全体の統計
          subjectRubricScoresSummary.overallStats = {
            totalStudentsWithRubricScores: allSubjectRubricScores.length,
            totalPossibleStudents: studentIds.length,
            rubricCoverageRate: parseFloat(
              (
                (allSubjectRubricScores.length / studentIds.length) *
                100
              ).toFixed(1)
            ),
            totalAssignments: allSubjectGrades.length,
            gradedAssignments: allSubjectRubricScores.length,
          };
        }

        // 科目統計にrubricScores要約を追加
        stats.subjectRubricScoresSummary = subjectRubricScoresSummary;
      });

      // 全科目統合のrubricScores統計を計算
      const allSubjectsData = Object.values(statsBySubject);
      const allCombinedGrades = allSubjectsData.flatMap((subject) =>
        subject.weeklyGrades.flatMap((wg) => wg.grades)
      );
      const allCombinedRubricScores = allCombinedGrades
        .filter((g) => g.rubricScores)
        .map((g) => g.rubricScores);

      let overallRubricScoresSummary = null;
      if (allCombinedRubricScores.length > 0) {
        const rubricKeys = [
          "communication",
          "creativeThinking",
          "criticalThinking",
          "identity",
          "responsibility",
          "socialResponsibility",
        ];

        overallRubricScoresSummary = {
          weekNumber: weekNumber,
          totalSubjects: allSubjectsData.filter(
            (s) => s.weeklyGrades.length > 0
          ).length,
          averageScores: {},
          scoreDistribution: {},
          performanceAnalysis: {},
          subjectComparison: {},
        };

        rubricKeys.forEach((key) => {
          const allScores = allCombinedRubricScores
            .filter(
              (rubric) => rubric[key] !== null && rubric[key] !== undefined
            )
            .map((rubric) => rubric[key]);

          if (allScores.length > 0) {
            // 全体平均スコア
            const overallAverage = parseFloat(
              (
                allScores.reduce((sum, score) => sum + score, 0) /
                allScores.length
              ).toFixed(1)
            );

            // 全体スコア分布
            const overallDistribution = {
              "0-19": allScores.filter((s) => s >= 0 && s < 20).length,
              "20-39": allScores.filter((s) => s >= 20 && s < 40).length,
              "40-59": allScores.filter((s) => s >= 40 && s < 60).length,
              "60-79": allScores.filter((s) => s >= 60 && s < 80).length,
              "80-100": allScores.filter((s) => s >= 80 && s <= 100).length,
            };

            // 全体パフォーマンス分析
            const minScore = Math.min(...allScores);
            const maxScore = Math.max(...allScores);
            const highPerformers = allScores.filter((s) => s >= 80).length;
            const lowPerformers = allScores.filter((s) => s < 40).length;

            overallRubricScoresSummary.averageScores[key] = overallAverage;
            overallRubricScoresSummary.scoreDistribution[key] =
              overallDistribution;
            overallRubricScoresSummary.performanceAnalysis[key] = {
              min: minScore,
              max: maxScore,
              range: maxScore - minScore,
              highPerformers: highPerformers,
              lowPerformers: lowPerformers,
              totalStudents: allScores.length,
              highPerformerRate: parseFloat(
                ((highPerformers / allScores.length) * 100).toFixed(1)
              ),
              lowPerformerRate: parseFloat(
                ((lowPerformers / allScores.length) * 100).toFixed(1)
              ),
            };

            // 科目別比較（この項目での各科目の平均）
            const subjectAverages = {};
            allSubjectsData.forEach((subject) => {
              if (subject.subjectRubricScoresSummary?.averageScores?.[key]) {
                subjectAverages[subject.subjectName] =
                  subject.subjectRubricScoresSummary.averageScores[key];
              }
            });
            overallRubricScoresSummary.subjectComparison[key] = subjectAverages;
          } else {
            overallRubricScoresSummary.averageScores[key] = 0;
            overallRubricScoresSummary.scoreDistribution[key] = {
              "0-19": 0,
              "20-39": 0,
              "40-59": 0,
              "60-79": 0,
              "80-100": 0,
            };
            overallRubricScoresSummary.performanceAnalysis[key] = {
              min: 0,
              max: 0,
              range: 0,
              highPerformers: 0,
              lowPerformers: 0,
              totalStudents: 0,
              highPerformerRate: 0,
              lowPerformerRate: 0,
            };
            overallRubricScoresSummary.subjectComparison[key] = {};
          }
        });

        // 全体統計
        overallRubricScoresSummary.overallStats = {
          totalStudentsWithRubricScores: allCombinedRubricScores.length,
          totalPossibleStudents: studentIds.length,
          rubricCoverageRate: parseFloat(
            (
              (allCombinedRubricScores.length / studentIds.length) *
              100
            ).toFixed(1)
          ),
          totalAssignments: allCombinedGrades.length,
          gradedAssignments: allCombinedRubricScores.length,
          averageScoreAcrossAllRubrics: parseFloat(
            (
              Object.values(overallRubricScoresSummary.averageScores).reduce(
                (sum, score) => sum + score,
                0
              ) / 6
            ).toFixed(1)
          ),
        };
      }

      return {
        week: weekLabel,
        dateRange:
          weekLabel.includes("This Week") || weekLabel.includes("Current")
            ? `Week ${currentWeekNumber}`
            : weekLabel.includes("Last Week") || weekLabel.includes("Previous")
            ? `Week ${lastWeekNumber}`
            : "Latest Available Data",
        subjects: Object.values(statsBySubject),
        overallRubricScoresSummary: overallRubricScoresSummary, // 全科目統合統計を追加
      };
    } catch (error) {
      console.error("Error in calculateSubmissionStats:", error);
      return {
        week: weekLabel,
        dateRange: "Error occurred",
        subjects: [],
        overallRubricScoresSummary: {},
      };
    }
  };

  // 今週と先週の統計を計算
  const currentWeekStats = await calculateSubmissionStats(
    currentWeekHomeworks,
    `This Week (Week ${currentWeekNumber})`
  );

  const lastWeekStats = await calculateSubmissionStats(
    lastWeekHomeworks,
    `Last Week (Week ${lastWeekNumber})`
  );

  // レスポンスメッセージの決定
  let noteMessage = `Statistics based on week numbers - This Week: Week ${currentWeekNumber}, Last Week: Week ${lastWeekNumber}.`;

  if (currentWeekHomeworks.length === 0 && lastWeekHomeworks.length === 0) {
    noteMessage = "No homeworks found for specified weeks.";
  }

  return res.status(200).json({
    message: `Division ${teacherDivision} homework submission statistics retrieved successfully`,
    division: teacherDivision,
    totalStudents: studentIds.length,
    teacherInfo: {
      name: `${user.profile.firstName} ${user.profile.lastName}`,
      division: teacherDivision,
      teacherId: user._id,
    },
    weekDefinition: "Monday to Friday",
    basedOn: "Week field in homework collection",
    referenceDate: `Week ${currentWeekNumber}`,
    note: noteMessage,
    statistics: {
      currentWeek: currentWeekStats,
      lastWeek: lastWeekStats,
    },
    generatedAt: new Date().toISOString(),
  });
});

/**
 * @purpose ログインした先生のdivision専用：特定期間の詳細な提出統計
 * @route GET /api/analytics/division14/submission-stats/custom
 * @access Private (先生のみ、自分のdivisionのデータのみ)
 */

// 特定期間の詳細な提出統計 今週と先週に提出した宿題の提出率のデータを科目ごとに取得
const getDivisionCustomPeriodStats = asyncHandler(async (req, res) => {
  const user = req.user;
  const { startDate, endDate } = req.query;

  // 先生かどうかチェック
  if (user.role !== "teacher") {
    return res
      .status(403)
      .json({ message: "Forbidden: Only teachers can access this data." });
  }

  // ログインユーザーのdivisionを取得
  const teacherDivision = user.profile.division;

  if (!teacherDivision) {
    return res
      .status(400)
      .json({ message: "Teacher division not found in profile." });
  }

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "Start date and end date are required." });
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // ログインした先生のdivisionの生徒を取得
    const divisionStudents = await User.find({
      role: "student",
      "profile.division": teacherDivision,
    }).select("_id profile.firstName profile.lastName");

    const studentIds = divisionStudents.map((student) => student._id);

    // ログインした先生が作成した指定期間のホームワークを取得
    const homeworks = await Homework.find({
      uploadedBy: user._id, // 先生が作成したホームワークのみ
      createdAt: {
        $gte: start,
        $lte: end,
      },
    }).populate("subject", "name");

    // 科目別の統計を計算
    const statsBySubject = {};
    const detailedStats = [];

    for (const homework of homeworks) {
      const subjectName = homework.subject?.name || "Unknown Subject";

      // 科目別統計の初期化
      if (!statsBySubject[subjectName]) {
        statsBySubject[subjectName] = {
          subjectName,
          totalHomeworks: 0,
          totalPossibleSubmissions: 0,
          totalSubmissions: 0,
          totalOnTimeSubmissions: 0,
          totalLateSubmissions: 0,
        };
      }

      // このホームワークの提出状況を取得（先生のdivisionの生徒のみ）
      const submissions = await Submission.find({
        homework: homework._id,
        student: { $in: studentIds },
      }).populate("student", "profile.firstName profile.lastName");

      const submittedStudents = submissions.map((sub) =>
        sub.student._id.toString()
      );
      const notSubmittedStudents = divisionStudents.filter(
        (student) => !submittedStudents.includes(student._id.toString())
      );

      const onTimeSubmissions = submissions.filter(
        (sub) => sub.submissionStatus === "submitted"
      ).length;
      const lateSubmissions = submissions.filter(
        (sub) => sub.submissionStatus === "late"
      ).length;

      // 科目別統計を更新
      statsBySubject[subjectName].totalHomeworks += 1;
      statsBySubject[subjectName].totalPossibleSubmissions +=
        divisionStudents.length;
      statsBySubject[subjectName].totalSubmissions += submissions.length;
      statsBySubject[subjectName].totalOnTimeSubmissions += onTimeSubmissions;
      statsBySubject[subjectName].totalLateSubmissions += lateSubmissions;

      // 詳細統計に追加
      detailedStats.push({
        homeworkId: homework._id,
        title: homework.title,
        subject: subjectName,
        dueDate: homework.dueDate,
        createdAt: homework.createdAt,
        totalStudents: divisionStudents.length,
        submittedCount: submissions.length,
        submissionRate: `${(
          (submissions.length / divisionStudents.length) *
          100
        ).toFixed(1)}%`,
        onTimeCount: onTimeSubmissions,
        lateCount: lateSubmissions,
        notSubmittedStudents: notSubmittedStudents.map((student) => ({
          id: student._id,
          name: `${student.profile.firstName} ${student.profile.lastName}`,
        })),
      });
    }

    // 科目別の平均提出率を計算
    const subjectSummary = Object.keys(statsBySubject).map((subjectName) => {
      const stats = statsBySubject[subjectName];
      const averageSubmissionRate =
        stats.totalPossibleSubmissions > 0
          ? (
              (stats.totalSubmissions / stats.totalPossibleSubmissions) *
              100
            ).toFixed(1)
          : "0.0";

      return {
        subjectName,
        totalHomeworks: stats.totalHomeworks,
        averageSubmissionRate: `${averageSubmissionRate}%`,
        totalSubmissions: stats.totalSubmissions,
        totalPossibleSubmissions: stats.totalPossibleSubmissions,
        onTimeSubmissions: stats.totalOnTimeSubmissions,
        lateSubmissions: stats.totalLateSubmissions,
      };
    });

    return res.status(200).json({
      message: `Custom period submission statistics for Division ${teacherDivision} retrieved successfully`,
      division: teacherDivision,
      teacherInfo: {
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        division: teacherDivision,
        teacherId: user._id,
      },
      period: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      },
      totalStudents: divisionStudents.length,
      totalHomeworks: homeworks.length,
      subjectSummary, // 科目別平均提出率
      detailedStats, // 各ホームワークの詳細
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error calculating custom period statistics:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("User info:", {
      id: user?._id,
      name: `${user?.profile?.firstName || ""} ${
        user?.profile?.lastName || ""
      }`,
      division: user?.profile?.division,
    });
    return res.status(500).json({
      message: "Failed to calculate custom period statistics",
      error: error.message,
    });
  }
});

export { getDivisionSubmissionStats, getDivisionCustomPeriodStats };
