/**
 * @purpose 出席管理のためのルート設定（記録・閲覧）
 */

import express from "express";
import { saveAttendanceRecords } from "../../controllers/attendance/recordController.js";
import {
  getAttendanceByDivision,
  getAttendanceStats,
} from "../../controllers/attendance/viewController.js";
import {
  getStudentsByMyDivision,
  getStudentsByDivision,
} from "../../controllers/attendance/studentController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

// === 出席記録の保存 ===
// 出席記録を保存（認証必須）
router.route("/save-records").post(protect, saveAttendanceRecords);

// === 出席データの閲覧 ===
// ログインした先生のdivisionの出欠状況を取得（認証必須）
router.route("/my-division").get(protect, getAttendanceByDivision);

// 出席統計を取得（認証必須）
router.route("/stats").get(protect, getAttendanceStats);

// === 学生管理 ===
// ログインした先生のdivisionの学生一覧を取得（認証必須）
router.route("/students/my-division").get(protect, getStudentsByMyDivision);

// テスト用: 認証なしで特定divisionの学生を取得
router.route("/students/division/:division").get(getStudentsByDivision);

export default router;
