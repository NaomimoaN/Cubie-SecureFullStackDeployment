import User from "../../models/userModel.js";
import Submission from "../../models/submissionModel.js";
import Homework from "../../models/homeworkModel.js";
import Subject from "../../models/subjectModel.js";
import mongoose from "mongoose";

// Core Competencies fields
const coreCompetencies = [
  "communication",
  "creativeThinking",
  "criticalThinking",
  "identity",
  "responsibility",
  "socialResponsibility",
];

// Core Competenciesの計算関数
const calculateCoreCompetencyAverages = (submissions) => {
  const totals = {};
  const counts = {};

  // 初期化
  coreCompetencies.forEach((comp) => {
    totals[comp] = 0;
    counts[comp] = 0;
  });

  // 各submissionのrubricScoresを集計
  submissions.forEach((submission) => {
    const rubricScores = submission.grade?.rubricScores;
    if (rubricScores) {
      coreCompetencies.forEach((comp) => {
        const score = rubricScores[comp];
        if (score !== null && score !== undefined && !isNaN(score)) {
          totals[comp] += score;
          counts[comp] += 1;
        }
      });
    }
  });

  // 平均を計算
  const averages = {};
  coreCompetencies.forEach((comp) => {
    averages[comp] =
      counts[comp] > 0
        ? parseFloat((totals[comp] / counts[comp]).toFixed(2))
        : 0;
  });

  return averages;
};

const getCoreCompetenciesBySubject = async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const { term } = req.query; // URLクエリからtermを取得

    // ログインユーザーが親であることを確認
    const parentUser = await User.findById(userId);
    if (!parentUser || parentUser.role !== "parent") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Parent role required.",
      });
    }

    // familyStudentsが存在することを確認
    if (!parentUser.familyStudents || parentUser.familyStudents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No family students found.",
      });
    }

    const familyStudentIds = parentUser.familyStudents;
    const targetSubjects = [
      "Math",
      "Language Arts",
      "Science",
      "ADST",
      "Social Studies",
    ];

    // MongoDB aggregation pipeline
    const pipeline = [
      // submissionsコレクションから家族の学生のsubmissionを取得
      {
        $match: {
          student: { $in: familyStudentIds },
        },
      },
      // homeworksコレクションとjoin
      {
        $lookup: {
          from: "homeworks",
          localField: "homework",
          foreignField: "_id",
          as: "homeworkInfo",
        },
      },
      {
        $unwind: "$homeworkInfo",
      },
      // subjectsコレクションとjoin
      {
        $lookup: {
          from: "subjects",
          localField: "homeworkInfo.subject",
          foreignField: "_id",
          as: "subjectInfo",
        },
      },
      {
        $unwind: "$subjectInfo",
      },
      // 指定されたterm かつ対象科目のみフィルター
      {
        $match: {
          "homeworkInfo.term": parseInt(term) || 3, // デフォルトはterm3
          "subjectInfo.name": { $in: targetSubjects },
        },
      },
      // 必要なフィールドのみ選択
      {
        $project: {
          student: 1,
          "subjectInfo.name": 1,
          "grade.rubricScores": 1,
        },
      },
      // 学生と科目でグループ化
      {
        $group: {
          _id: {
            studentId: "$student",
            subjectName: "$subjectInfo.name",
          },
          submissions: {
            $push: {
              grade: "$grade",
            },
          },
          totalSubmissions: { $sum: 1 },
        },
      },
      // 学生でグループ化
      {
        $group: {
          _id: "$_id.studentId",
          subjects: {
            $push: {
              subjectName: "$_id.subjectName",
              submissions: "$submissions",
              totalSubmissions: "$totalSubmissions",
            },
          },
        },
      },
    ];

    const results = await Submission.aggregate(pipeline);

    // 全ての家族の学生情報を取得（submissionがない学生も含む）
    const allStudents = await User.find(
      { _id: { $in: familyStudentIds } },
      { "profile.firstName": 1, "profile.lastName": 1 }
    );

    // aggregation結果をMap形式に変換（学生IDをキーとして）
    const submissionDataMap = new Map();
    results.forEach((result) => {
      submissionDataMap.set(result._id.toString(), result.subjects);
    });

    // 全ての学生に対して結果を作成
    const formattedResults = allStudents.map((student) => {
      const studentId = student._id.toString();
      const studentName = `${student.profile.firstName} ${student.profile.lastName}`;

      // この学生のsubmissionデータがあるかチェック
      const studentSubjects = submissionDataMap.get(studentId) || [];

      const subjectData = {};
      let allSubjectSubmissions = []; // 全科目のsubmissionsを収集

      // submissionがある科目のデータを処理
      studentSubjects.forEach((subject) => {
        const coreCompAverages = calculateCoreCompetencyAverages(
          subject.submissions
        );

        subjectData[subject.subjectName] = {
          coreCompetencies: coreCompAverages,
          totalSubmissions: subject.totalSubmissions,
          validSubmissions: subject.submissions.filter(
            (s) => s.grade?.rubricScores
          ).length,
        };

        // 全科目のsubmissionsに追加
        allSubjectSubmissions = allSubjectSubmissions.concat(
          subject.submissions
        );
      });

      // 対象科目すべてに対してデータを保証（submissionがない科目もデフォルト値で）
      targetSubjects.forEach((subjectName) => {
        if (!subjectData[subjectName]) {
          const defaultCoreComp = {};
          coreCompetencies.forEach((comp) => {
            defaultCoreComp[comp] = 0;
          });

          subjectData[subjectName] = {
            coreCompetencies: defaultCoreComp,
            totalSubmissions: 0,
            validSubmissions: 0,
          };
        }
      });

      // 全科目合わせたCore Competenciesの平均を計算
      const overallCoreCompetencies = calculateCoreCompetencyAverages(
        allSubjectSubmissions
      );

      return {
        studentId: student._id,
        studentName: studentName,
        subjects: subjectData,
        overallCoreCompetencies: overallCoreCompetencies,
        totalSubmissionsAllSubjects: allSubjectSubmissions.length,
      };
    });

    res.json({
      success: true,
      data: formattedResults,
      term: parseInt(term) || 3,
      familyStudentsCount: familyStudentIds.length,
      dataRetrievedFor: formattedResults.length,
    });
  } catch (error) {
    console.error("Error fetching core competencies by subject:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// 1年間総合のCoreCompデータを取得
const getYearlyCoreCompBySubject = async (req, res) => {
  try {
    const { studentId } = req.params;

    // 1年間（Term 1, 2, 3）のデータを取得
    const result = await Submission.aggregate([
      // 指定された学生のデータのみをフィルタ
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          "grade.letterGrade": { $exists: true, $ne: null },
        },
      },
      // homework情報を取得
      {
        $lookup: {
          from: "homeworks",
          localField: "homework",
          foreignField: "_id",
          as: "homeworkInfo",
        },
      },
      {
        $unwind: "$homeworkInfo",
      },
      // subject情報を取得
      {
        $lookup: {
          from: "subjects",
          localField: "homeworkInfo.subject",
          foreignField: "_id",
          as: "subjectInfo",
        },
      },
      {
        $unwind: "$subjectInfo",
      },
      // 科目でグループ化
      {
        $group: {
          _id: "$subjectInfo.name",
          submissions: { $push: "$$ROOT" },
          totalSubmissions: { $sum: 1 },
          validGrades: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$grade.letterGrade", null] },
                    { $ne: ["$grade.letterGrade", ""] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      // 結果を整形
      {
        $project: {
          subject: "$_id",
          submissions: 1,
          totalSubmissions: 1,
          validGrades: 1,
          _id: 0,
        },
      },
    ]);

    // 結果を整形して、6つのCoreCompの年間平均を計算
    const formattedResult = result.map((subject) => {
      // 6つのCoreCompの合計とカウントを初期化
      const coreCompTotals = {
        communication: 0,
        creativeThinking: 0,
        criticalThinking: 0,
        identity: 0,
        responsibility: 0,
        socialResponsibility: 0,
      };
      const coreCompCounts = {
        communication: 0,
        creativeThinking: 0,
        criticalThinking: 0,
        identity: 0,
        responsibility: 0,
        socialResponsibility: 0,
      };

      // 各submissionのrubricScoresからCoreCompスコアを集計
      subject.submissions.forEach((submission) => {
        const rubricScores = submission.grade?.rubricScores;
        if (rubricScores) {
          // 各CoreCompのスコアを集計
          Object.keys(coreCompTotals).forEach((comp) => {
            const score = rubricScores[comp];
            if (score !== null && score !== undefined && !isNaN(score)) {
              coreCompTotals[comp] += score;
              coreCompCounts[comp] += 1;
            }
          });
        }
      });

      // 各CoreCompの平均を計算（100点満点を4点満点に変換）
      const coreCompAverages = {};
      Object.keys(coreCompTotals).forEach((comp) => {
        const rawAverage =
          coreCompCounts[comp] > 0
            ? coreCompTotals[comp] / coreCompCounts[comp]
            : 0;
        // 100点満点を4点満点に変換
        coreCompAverages[comp] = Math.round((rawAverage / 25) * 100) / 100;
      });

      // 全体の平均スコアを計算
      const validAverages = Object.values(coreCompAverages).filter(
        (score) => score > 0
      );
      const overallAverage =
        validAverages.length > 0
          ? Math.round(
              (validAverages.reduce((sum, score) => sum + score, 0) /
                validAverages.length) *
                100
            ) / 100
          : 0;

      // 平均スコアをLetter Gradeに変換
      let averageLetterGrade = "No Data";
      if (overallAverage >= 3.5) {
        averageLetterGrade = "Extending";
      } else if (overallAverage >= 2.5) {
        averageLetterGrade = "Proficient";
      } else if (overallAverage >= 1.5) {
        averageLetterGrade = "Developing";
      } else if (overallAverage > 0) {
        averageLetterGrade = "Emerging";
      }

      return {
        subject: subject.subject,
        coreCompAverages: coreCompAverages,
        overallAverage: overallAverage,
        averageLetterGrade: averageLetterGrade,
        totalSubmissions: subject.totalSubmissions,
        validGrades: subject.validGrades,
      };
    });

    res.json({
      success: true,
      data: formattedResult,
    });
  } catch (error) {
    console.error("Error in getYearlyCoreCompBySubject:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export { getCoreCompetenciesBySubject, getYearlyCoreCompBySubject };
