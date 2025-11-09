/**
 * @purpose 出席管理用学生データコントローラー
 * ログインした先生のdivisionの学生データを取得
 */

import User from "../../models/userModel.js";

/**
 * 自分のdivisionの学生一覧を取得
 * GET /api/attendance/students/my-division
 */
export const getStudentsByMyDivision = async (req, res) => {
  try {
    // 認証チェック
    if (!req.user) {
      console.log("❌ Authentication failed: req.user is null/undefined");
      return res.status(401).json({
        success: false,
        message: "Required authentication.",
      });
    }

    // 先生権限チェック
    if (req.user.role !== "teacher") {
      console.log("❌ Authorization failed: User is not a teacher");
      return res.status(403).json({
        success: false,
        message: "Only teachers can access this page.",
      });
    }

    // division情報チェック
    const teacherDivision = req.user.profile?.division;

    if (!teacherDivision) {
      console.log(
        "❌ Division information not found for teacher:",
        req.user._id
      );
      return res.status(400).json({
        success: false,
        message: "Division information is not set for the teacher.",
        debug: {
          userRole: req.user.role,
          userId: req.user._id,
          profileKeys: Object.keys(req.user.profile || {}),
        },
      });
    }

    console.log(`📋 Fetching students for Division ${teacherDivision}`);

    // 同じdivisionの学生を取得
    const students = await User.find({
      role: "student",
      "profile.division": teacherDivision,
    })
      .select(
        "profile.firstName profile.lastName profile.studentId profile.division profile.grade"
      )
      .sort({ "profile.lastName": 1, "profile.firstName": 1 }); // 姓名順でソート

    console.log(
      `Found ${students.length} students in division ${teacherDivision}`
    );

    // レスポンス形式を整形
    const formattedStudents = students.map((student) => ({
      _id: student._id,
      studentId: student.profile?.studentId || "",
      firstName: student.profile?.firstName || "",
      lastName: student.profile?.lastName || "",
      division: student.profile?.division || "",
      grade: student.profile?.grade || "",
    }));

    res.status(200).json({
      success: true,
      message: `Division ${teacherDivision} students data fetched.`,
      data: formattedStudents,
      division: teacherDivision,
      teacher: {
        name: `${req.user.profile?.firstName} ${req.user.profile?.lastName}`,
        division: req.user.profile?.division,
      },
      stats: {
        total: formattedStudents.length,
        division: teacherDivision,
      },
    });
  } catch (error) {
    console.error("Student data fetching error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student data.",
      error: error.message,
    });
  }
};

/**
 * 特定divisionの学生一覧を取得（開発用）
 * GET /api/attendance/students/division/:division
 */
export const getStudentsByDivision = async (req, res) => {
  try {
    const { division } = req.params;

    if (!division) {
      return res.status(400).json({
        success: false,
        message: "Division number is required.",
      });
    }

    console.log(`Fetching students for division: ${division}`);

    // 指定divisionの学生を取得
    const students = await User.find({
      role: "student",
      "profile.division": parseInt(division),
    })
      .select(
        "profile.firstName profile.lastName profile.studentId profile.division profile.grade"
      )
      .sort({ "profile.lastName": 1, "profile.firstName": 1 });

    console.log(`Found ${students.length} students in division ${division}`);

    // レスポンス形式を整形
    const formattedStudents = students.map((student) => ({
      _id: student._id,
      studentId: student.profile?.studentId || "",
      firstName: student.profile?.firstName || "",
      lastName: student.profile?.lastName || "",
      division: student.profile?.division || "",
      grade: student.profile?.grade || "",
    }));

    res.status(200).json({
      success: true,
      message: `Students data of Division ${division}`,
      data: formattedStudents,
      division: parseInt(division),
      stats: {
        total: formattedStudents.length,
        division: parseInt(division),
      },
    });
  } catch (error) {
    console.error("Error fetching student data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student data.",
      error: error.message,
    });
  }
};
