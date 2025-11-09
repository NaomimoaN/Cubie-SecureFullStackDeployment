import asyncHandler from "express-async-handler";
import Attendance from "../models/Attendance.js";
import Submission from "../models/submissionModel.js";
import User from "../models/userModel.js";
import moment from "moment-timezone";
import { getCurrentWeekDetails } from "../utils/currentWeekUtils.js";
import AcademicWeek from "../models/AcademicWeek.js";
import Homework from "../models/homeworkModel.js";

/**
 * 学生の1週間の出席状況を取得
 * @route GET /api/attendance/student/:studentId
 * @access Private (Student only)
 */
const getStudentAttendanceForWeek = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { startDate, endDate } = req.query;

  // 認証チェック
  if (!req.user || req.user.role !== "student") {
    res.status(403);
    throw new Error("Forbidden: Only students can access this data.");
  }

  // 自分のデータのみアクセス可能
  if (req.user._id.toString() !== studentId) {
    res.status(403);
    throw new Error("Forbidden: You can only access your own data.");
  }

  try {
    const start = moment
      .tz(startDate, "America/Vancouver")
      .startOf("day")
      .toDate();
    const end = moment.tz(endDate, "America/Vancouver").endOf("day").toDate();

    const attendanceRecords = await Attendance.find({
      studentId: studentId,
      date: {
        $gte: start,
        $lte: end,
      },
    }).sort({ date: 1 });

    res.status(200).json({
      success: true,
      data: attendanceRecords,
    });
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    res.status(500);
    throw new Error("Failed to fetch attendance data.");
  }
});

/**
 * 学生の宿題提出状況を取得
 * @route GET /api/submissions/student/:studentId
 * @access Private (Student only)
 */
const getStudentHomeworkSubmissions = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { startDate, endDate } = req.query;

  // 認証チェック
  if (!req.user || req.user.role !== "student") {
    res.status(403);
    throw new Error("Forbidden: Only students can access this data.");
  }

  // 自分のデータのみアクセス可能
  if (req.user._id.toString() !== studentId) {
    res.status(403);
    throw new Error("Forbidden: You can only access your own data.");
  }

  try {
    const start = moment
      .tz(startDate, "America/Vancouver")
      .startOf("day")
      .toDate();
    const end = moment.tz(endDate, "America/Vancouver").endOf("day").toDate();

    const submissions = await Submission.find({
      student: studentId,
      submittedAt: {
        $gte: start,
        $lte: end,
      },
      submissionStatus: { $in: ["submitted", "graded"] },
    })
      .populate("homework", "title dueDate")
      .sort({ submittedAt: 1 });

    res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error("Error fetching student homework submissions:", error);
    res.status(500);
    throw new Error("Failed to fetch homework submission data.");
  }
});

/**
 * 学生の成績データを取得
 * @route GET /api/grades/student/:studentId
 * @access Private (Student only)
 */
const getStudentGrades = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  // 認証チェック
  if (!req.user || req.user.role !== "student") {
    res.status(403);
    throw new Error("Forbidden: Only students can access this data.");
  }

  // 自分のデータのみアクセス可能
  if (req.user._id.toString() !== studentId) {
    res.status(403);
    throw new Error("Forbidden: You can only access your own data.");
  }

  try {
    const submissions = await Submission.find({
      student: studentId,
      submissionStatus: "graded",
      "grade.letterGrade": { $exists: true, $ne: null },
    })
      .populate("homework", "title subject")
      .select("grade.letterGrade grade.score homework")
      .sort({ "grade.gradedAt": -1 });

    const grades = submissions.map((submission) => ({
      letterGrade: submission.grade?.letterGrade,
      score: submission.grade?.score,
      homeworkTitle: submission.homework?.title,
      subject: submission.homework?.subject,
      gradedAt: submission.grade?.gradedAt,
    }));

    res.status(200).json({
      success: true,
      data: grades,
    });
  } catch (error) {
    console.error("Error fetching student grades:", error);
    res.status(500);
    throw new Error("Failed to fetch grade data.");
  }
});

/**
 * 学生のバッジ獲得状況を取得
 * @route GET /api/badges/student/:studentId
 * @access Private (Student only)
 */
const getStudentBadges = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  // 認証チェック
  if (!req.user || req.user.role !== "student") {
    res.status(403);
    throw new Error("Forbidden: Only students can access this data.");
  }

  // 自分のデータのみアクセス可能
  if (req.user._id.toString() !== studentId) {
    res.status(403);
    throw new Error("Forbidden: You can only access your own data.");
  }

  try {
    // AcademicWeekシステムから現在の週の詳細を取得
    const currentWeekDetails = await getCurrentWeekDetails();

    if (!currentWeekDetails) {
      res.status(404);
      throw new Error("Current week information not found.");
    }

    const { startDate, endDate } = currentWeekDetails;

    // 1. 出席状況をチェック
    const attendanceRecords = await Attendance.find({
      studentId: studentId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // デバッグログを追加
    const attendanceBadge =
      attendanceRecords.length > 0 &&
      attendanceRecords.every((record) => record.status === "present");

    // 2. 宿題提出状況をチェック
    const homeworkSubmissions = await Submission.find({
      student: studentId,
      submittedAt: {
        $gte: startDate,
        $lte: endDate,
      },
      submissionStatus: { $in: ["submitted", "graded"] },
    }).populate("homework", "dueDate");

    const homeworkBadge =
      homeworkSubmissions.length > 0 &&
      homeworkSubmissions.every((submission) => {
        const submittedDate = new Date(submission.submittedAt);
        const dueDate = new Date(submission.homework?.dueDate);
        return submittedDate <= dueDate;
      });

    // 3. Extendingの回数をチェック（現在のtermのみ）
    // 現在のtermを取得（isCurrent: trueのAcademicWeekから）
    const currentAcademicWeek = await AcademicWeek.findOne({ isCurrent: true });
    let currentTerm = null;

    if (currentAcademicWeek && currentAcademicWeek.term) {
      currentTerm = currentAcademicWeek.term;
    }

    let extendingBadge = false;
    if (currentTerm) {
      // 現在のtermのホームワークでExtendingを獲得した提出をカウント
      const currentTermHomeworks = await Homework.find({ term: currentTerm });
      const currentTermHomeworkIds = currentTermHomeworks.map((hw) => hw._id);

      const currentTermExtendingSubmissions = await Submission.find({
        student: studentId,
        homework: { $in: currentTermHomeworkIds },
        // submissionStatus: "graded",
        "grade.letterGrade": "Extending",
      });

      extendingBadge = currentTermExtendingSubmissions.length >= 3;
    }

    const badges = {
      yellow: attendanceBadge, // 1週間無遅刻無欠席でYellowバッジ
      blue: homeworkBadge, // 1週間全宿題期限内提出でBlueバッジ
      pink: extendingBadge, // Extending3回以上でPinkバッジ
    };

    res.status(200).json({
      success: true,
      data: badges,
    });
  } catch (error) {
    console.error("Error fetching student badges:", error);
    res.status(500);
    throw new Error("Failed to fetch badge data.");
  }
});

export {
  getStudentAttendanceForWeek,
  getStudentHomeworkSubmissions,
  getStudentGrades,
  getStudentBadges,
};
