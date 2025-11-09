/**
 * @purpose 教師ダッシュボード専用の軽量APIルート
 * 各チャートコンポーネントが個別にデータを取得できるように最適化
 */

import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import {
  getSubmissionStatsForChart,
  getCoreCompetenciesForChart,
  getSubjectBarChartData,
  getSubjectDonutChartData,
} from "../../controllers/analytics/teacherDashboardController.js";

const router = express.Router();

// 提出統計チャート専用API
router.get("/submission-stats-chart", protect, getSubmissionStatsForChart);

// 科目別コアコンピテンシーチャート専用API
router.get("/core-competencies-chart", protect, getCoreCompetenciesForChart);

// 科目別バーチャート専用API
router.get("/subject-bar-chart", protect, getSubjectBarChartData);

// 科目別ドーナツチャート専用API
router.get("/subject-donut-chart", protect, getSubjectDonutChartData);

export default router;
