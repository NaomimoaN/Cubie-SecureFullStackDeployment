import User from "../../models/userModel.js";
import Submission from "../../models/submissionModel.js";
import Homework from "../../models/homeworkModel.js";
import Subject from "../../models/subjectModel.js";

/**
 * @desc 親の子供のterm別科目別平均点を取得
 * @route GET /api/parent/analytics/scores-by-subject
 * @access Private (Parent only)
 */
export const getScoresBySubject = async (req, res) => {
  try {
    const { _id: userId, role } = req.user;
    const { term } = req.query; // URLクエリからtermを取得

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

    // 指定されたtermの科目別平均点を取得するためのAggregation Pipeline
    const studentSubjectScores = await Submission.aggregate([
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
      // 3. homeworkInfoが存在し、指定されたtermのもののみ
      {
        $match: {
          "homeworkInfo.0": { $exists: true },
          "homeworkInfo.0.term": parseInt(term) || 3, // デフォルトはterm3
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
          "subjectInfo.0.name": {
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
      // 8. 学生別、科目別にグループ化して平均点を計算
      {
        $group: {
          _id: {
            studentId: "$student",
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
          subject: "$_id.subject",
          subjectId: 1,
          averageScore: { $round: ["$averageScore", 2] },
          totalSubmissions: 1,
        },
      },
      // 10. 学生名、科目名でソート
      {
        $sort: { studentName: 1, subject: 1 },
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

    // 子供別にデータを整理
    const studentDataMap = new Map();

    // 各子供に対して基本情報を設定
    parentUser.familyStudents.forEach((student) => {
      const studentName = `${student.profile.firstName} ${student.profile.lastName}`;
      studentDataMap.set(student._id.toString(), {
        studentId: student._id,
        studentName: studentName,
        subjectScores: [],
        overallAverage: 0,
        totalSubjects: allSubjects.length,
        submittedSubjects: 0,
      });
    });

    // 取得したデータを子供別に振り分け
    studentSubjectScores.forEach((score) => {
      const studentKey = score.studentId.toString();
      if (studentDataMap.has(studentKey)) {
        studentDataMap.get(studentKey).subjectScores.push({
          subject: score.subject,
          subjectId: score.subjectId,
          averageScore: score.averageScore,
          totalSubmissions: score.totalSubmissions,
        });
      }
    });

    // 各子供に対して全科目のデータを確保し、平均点を計算
    const finalStudentData = [];

    studentDataMap.forEach((studentData, studentId) => {
      // 科目別の結果を整理
      const subjectMap = new Map();
      studentData.subjectScores.forEach((score) => {
        subjectMap.set(score.subject, score);
      });

      // 各科目のデータを作成
      const subjectScores = allSubjects.map((subjectName) => {
        if (subjectMap.has(subjectName)) {
          return subjectMap.get(subjectName);
        } else {
          return {
            subject: subjectName,
            subjectId: null,
            averageScore: 0,
            totalSubmissions: 0,
          };
        }
      });

      // 全体平均を計算（0点は除外）
      const nonZeroScores = subjectScores.filter(
        (score) => score.averageScore > 0
      );
      const overallAverage =
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

      finalStudentData.push({
        studentId: studentData.studentId,
        studentName: studentData.studentName,
        subjectScores: subjectScores,
        overallAverage: overallAverage,
        totalSubjects: allSubjects.length,
        submittedSubjects: nonZeroScores.length,
      });
    });

    // 全体の統計も計算
    const totalStudents = finalStudentData.length;
    const familyOverallAverage =
      totalStudents > 0
        ? Math.round(
            (finalStudentData.reduce(
              (sum, student) => sum + student.overallAverage,
              0
            ) /
              totalStudents) *
              100
          ) / 100
        : 0;

    res.status(200).json({
      success: true,
      data: {
        term: parseInt(term) || 3,
        totalStudents: totalStudents,
        familyOverallAverage: familyOverallAverage,
        students: finalStudentData,
        allSubjects: allSubjects,
      },
    });
  } catch (error) {
    console.error("Error in getScoresBySubject:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
