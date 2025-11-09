import User from "../../models/userModel.js";
import Submission from "../../models/submissionModel.js";
import Homework from "../../models/homeworkModel.js";
import Subject from "../../models/subjectModel.js";

// Letter Gradeの数値マッピング
const gradeToNumber = {
  Emerging: 1,
  Developing: 2,
  Proficient: 3,
  Extending: 4,
};

const numberToGrade = {
  1: "Emerging",
  2: "Developing",
  3: "Proficient",
  4: "Extending",
};

// 平均Letter Gradeを計算する関数
const calculateAverageLetterGrade = (letterGrades) => {
  if (!letterGrades || letterGrades.length === 0) {
    return null;
  }

  const numericGrades = letterGrades
    .filter((grade) => gradeToNumber[grade])
    .map((grade) => gradeToNumber[grade]);

  if (numericGrades.length === 0) {
    return null;
  }

  const average =
    numericGrades.reduce((sum, grade) => sum + grade, 0) / numericGrades.length;
  const roundedAverage = Math.round(average);

  return numberToGrade[roundedAverage] || null;
};

// Letter Gradeの分布を計算する関数
const calculateGradeDistribution = (letterGrades) => {
  const distribution = {
    Emerging: 0,
    Developing: 0,
    Proficient: 0,
    Extending: 0,
  };

  letterGrades.forEach((grade) => {
    if (distribution.hasOwnProperty(grade)) {
      distribution[grade]++;
    }
  });

  return distribution;
};

const getLetterGradesBySubject = async (req, res) => {
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
          "grade.letterGrade": 1,
        },
      },
      // 学生と科目でグループ化
      {
        $group: {
          _id: {
            studentId: "$student",
            subjectName: "$subjectInfo.name",
          },
          letterGrades: { $push: "$grade.letterGrade" },
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
              letterGrades: "$letterGrades",
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

      // submissionがある科目のデータを処理
      studentSubjects.forEach((subject) => {
        const validGrades = subject.letterGrades.filter(
          (grade) =>
            grade &&
            ["Emerging", "Developing", "Proficient", "Extending"].includes(
              grade
            )
        );

        subjectData[subject.subjectName] = {
          averageLetterGrade: calculateAverageLetterGrade(validGrades),
          gradeDistribution: calculateGradeDistribution(validGrades),
          totalSubmissions: subject.totalSubmissions,
          validGrades: validGrades.length,
        };
      });

      // 対象科目すべてに対してデータを保証（submissionがない科目もデフォルト値で）
      targetSubjects.forEach((subjectName) => {
        if (!subjectData[subjectName]) {
          subjectData[subjectName] = {
            averageLetterGrade: null,
            gradeDistribution: {
              Emerging: 0,
              Developing: 0,
              Proficient: 0,
              Extending: 0,
            },
            totalSubmissions: 0,
            validGrades: 0,
          };
        }
      });

      return {
        studentId: student._id,
        studentName: studentName,
        subjects: subjectData,
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
    console.error("Error fetching letter grades by subject:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export { getLetterGradesBySubject };
