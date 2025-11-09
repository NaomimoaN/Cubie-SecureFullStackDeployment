import User from "../../models/userModel.js";
import Submission from "../../models/submissionModel.js";
import Homework from "../../models/homeworkModel.js";
import Subject from "../../models/subjectModel.js";

/**
 * @desc 親の子供のterm別科目別平均点を取得（子供別に表示）
 * @route GET /api/parent/analytics/average-scores-by-subject
 * @access Private (Parent only)
 */
export const getAverageScoresBySubject = async (req, res) => {
  try {
    const { _id: userId, role } = req.user;

    // ログインユーザーがparentかどうかをチェック
    if (role !== "parent") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Parent role required.",
      });
    }

    // 親ユーザーの情報を取得（familyStudents含む）
    const parentUser = await User.findById(userId).populate("familyStudents");

    if (
      !parentUser ||
      !parentUser.familyStudents ||
      parentUser.familyStudents.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "No family students found for this parent.",
      });
    }

    // 子供のObjectIdを配列で取得
    const studentIds = parentUser.familyStudents.map((student) => student._id);

    // 子供別、term別、科目別の平均点を取得するためのAggregation Pipeline
    const studentTermSubjectScores = await Submission.aggregate([
      // 1. 対象の学生のsubmissionのみフィルタ
      {
        $match: {
          student: { $in: studentIds },
          "grade.score": { $ne: null, $exists: true },
        },
      },
      // 2. homeworksコレクションとJOIN
      {
        $lookup: {
          from: "homeworks",
          localField: "homework",
          foreignField: "_id",
          as: "homeworkInfo",
        },
      },
      // 3. homeworkInfoが存在し、termが設定されているもののみ
      {
        $match: {
          "homeworkInfo.0": { $exists: true },
          "homeworkInfo.0.term": { $in: [1, 2, 3] },
        },
      },
      // 4. subjectsコレクションとJOIN
      {
        $lookup: {
          from: "subjects",
          localField: "homeworkInfo.subject",
          foreignField: "_id",
          as: "subjectInfo",
        },
      },
      // 5. subjectInfoが存在するもののみ
      {
        $match: {
          "subjectInfo.0": { $exists: true },
        },
      },
      // 6. 必要な科目のみフィルタ
      {
        $match: {
          "subjectInfo.name": {
            $in: ["Math", "Language Arts", "Science", "ADST", "Social Studies"],
          },
        },
      },
      // 7. studentsコレクションとJOINして学生情報を取得
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "studentInfo",
        },
      },
      // 8. 学生別、term別、科目別にグループ化して平均点を計算
      {
        $group: {
          _id: {
            studentId: "$student",
            term: { $arrayElemAt: ["$homeworkInfo.term", 0] },
            subject: { $arrayElemAt: ["$subjectInfo.name", 0] },
          },
          averageScore: { $avg: "$grade.score" },
          totalSubmissions: { $sum: 1 },
          subjectId: { $first: { $arrayElemAt: ["$subjectInfo._id", 0] } },
          studentName: {
            $first: {
              $concat: [
                { $arrayElemAt: ["$studentInfo.profile.firstName", 0] },
                " ",
                { $arrayElemAt: ["$studentInfo.profile.lastName", 0] },
              ],
            },
          },
        },
      },
      // 9. 結果を整形
      {
        $project: {
          _id: 0,
          studentId: "$_id.studentId",
          studentName: 1,
          term: "$_id.term",
          subject: "$_id.subject",
          subjectId: 1,
          averageScore: { $round: ["$averageScore", 2] },
          totalSubmissions: 1,
        },
      },
      // 10. 学生名、term、科目名でソート
      {
        $sort: { studentName: 1, term: 1, subject: 1 },
      },
    ]);

    // 全科目のリスト
    const allSubjects = [
      "Math",
      "Language Arts",
      "Science",
      "ADST",
      "Social Studies",
    ];

    // 全termのリスト
    const allTerms = [1, 2, 3];

    // 子供別にデータを整理
    const studentDataMap = new Map();

    // 各子供に対して基本情報を設定
    parentUser.familyStudents.forEach((student) => {
      const studentName = `${student.profile.firstName} ${student.profile.lastName}`;
      studentDataMap.set(student._id.toString(), {
        studentId: student._id,
        studentName: studentName,
        termSubjectScores: [],
        overallAverages: {
          term1: 0,
          term2: 0,
          term3: 0,
        },
      });
    });

    // 取得したデータを子供別に振り分け
    studentTermSubjectScores.forEach((score) => {
      const studentKey = score.studentId.toString();
      if (studentDataMap.has(studentKey)) {
        studentDataMap.get(studentKey).termSubjectScores.push({
          term: score.term,
          subject: score.subject,
          subjectId: score.subjectId,
          averageScore: score.averageScore,
          totalSubmissions: score.totalSubmissions,
        });
      }
    });

    // 各子供に対して全term、全科目のデータを確保し、平均点を計算
    const finalStudentData = [];

    studentDataMap.forEach((studentData, studentId) => {
      // term別、科目別の結果を整理
      const termSubjectMap = new Map();
      studentData.termSubjectScores.forEach((score) => {
        const key = `${score.term}-${score.subject}`;
        termSubjectMap.set(key, score);
      });

      // 各termの科目別データを作成
      const termData = {};
      allTerms.forEach((term) => {
        const subjectScores = allSubjects.map((subjectName) => {
          const key = `${term}-${subjectName}`;
          if (termSubjectMap.has(key)) {
            return termSubjectMap.get(key);
          } else {
            return {
              term: term.toString(),
              subject: subjectName,
              subjectId: null,
              averageScore: 0,
              totalSubmissions: 0,
            };
          }
        });

        // このtermの全体平均を計算（0点は除外）
        const nonZeroScores = subjectScores.filter(
          (score) => score.averageScore > 0
        );
        const termAverage =
          nonZeroScores.length > 0
            ? Math.round(
                (nonZeroScores.reduce(
                  (sum, score) => sum + score.averageScore,
                  0
                ) /
                  nonZeroScores.length) *
                  100
              ) / 100
            : 0;

        termData[`term${term}`] = {
          term: term.toString(),
          subjectScores: subjectScores,
          average: termAverage,
          totalSubjects: allSubjects.length,
          submittedSubjects: nonZeroScores.length,
        };
      });

      finalStudentData.push({
        studentId: studentData.studentId,
        studentName: studentData.studentName,
        termData: termData,
        overallAverages: {
          term1: termData.term1.average,
          term2: termData.term2.average,
          term3: termData.term3.average,
        },
      });
    });

    // 全体の統計も計算
    const totalStudents = finalStudentData.length;
    const familyTermAverages = {
      term1: 0,
      term2: 0,
      term3: 0,
    };

    allTerms.forEach((term) => {
      const termKey = `term${term}`;
      const termAverages = finalStudentData
        .map((student) => student.overallAverages[termKey])
        .filter((avg) => avg > 0);

      familyTermAverages[termKey] =
        termAverages.length > 0
          ? Math.round(
              (termAverages.reduce((sum, avg) => sum + avg, 0) /
                termAverages.length) *
                100
            ) / 100
          : 0;
    });

    res.status(200).json({
      success: true,
      data: {
        totalStudents: totalStudents,
        familyTermAverages: familyTermAverages,
        students: finalStudentData,
        allSubjects: allSubjects,
        allTerms: allTerms,
      },
    });
  } catch (error) {
    console.error("Error in getAverageScoresBySubject:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
