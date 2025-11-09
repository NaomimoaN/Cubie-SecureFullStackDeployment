import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getStudentAttendanceForWeek,
  getStudentHomeworkSubmissions,
  getStudentGrades,
  getStudentBadges,
} from "../controllers/badgeController.js";

const router = express.Router();

// 学生の1週間の出席状況を取得
router.get(
  "/attendance/student/:studentId",
  protect,
  authorize(["student"]),
  getStudentAttendanceForWeek
);

// 学生の宿題提出状況を取得
router.get(
  "/submissions/student/:studentId",
  protect,
  authorize(["student"]),
  getStudentHomeworkSubmissions
);

// 学生の成績データを取得
router.get(
  "/grades/student/:studentId",
  protect,
  authorize(["student"]),
  getStudentGrades
);

// 学生のバッジ獲得状況を取得
router.get(
  "/badges/student/:studentId",
  protect,
  authorize(["student"]),
  getStudentBadges
);

export default router;
