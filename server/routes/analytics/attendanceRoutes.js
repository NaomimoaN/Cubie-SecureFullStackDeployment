/**
 * @purpose 出欠管理の統計・分析のためのルート設定
 */

import express from "express";
import {
  generateAttendanceData,
  clearAllAttendanceData,
  generateSubmissionData,
  getWeeklyAttendanceStats,
} from "../../controllers/analytics/attendanceController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

// === 統計・分析機能 ===
// 今週の5日分の出席率統計を取得（認証必須）
router.route("/weekly-stats").get(protect, getWeeklyAttendanceStats);

// === 開発用データ生成機能 ===
// 出欠データ生成（開発用）
router.route("/generate-test-data").post(generateAttendanceData);

// 全ての出欠データを削除（開発用）
router.route("/clear-all-data").delete(clearAllAttendanceData);

// 提出データ生成（開発用）
router.route("/generate-submissions/:division").post(generateSubmissionData);

export default router;
