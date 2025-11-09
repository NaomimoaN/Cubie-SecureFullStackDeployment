/**
 * @purpose ログインした先生のdivision専用の提出統計とレポート機能のルート管理
 */

import express from "express";
const router = express.Router();
import { protect, authorize } from "../../middleware/authMiddleware.js";
import * as submissionStatsController from "../../controllers/analytics/submissionStatsController.js";

// ログインした先生のdivision専用：今週と先週のホームワーク提出率統計
router.get(
  "/division/submission-stats",
  protect,
  authorize(["teacher"]),
  submissionStatsController.getDivisionSubmissionStats
);

// ログインした先生のdivision専用：カスタム期間の詳細提出統計
router.get(
  "/division/submission-stats/custom",
  protect,
  authorize(["teacher"]),
  submissionStatsController.getDivisionCustomPeriodStats
);

export default router;
