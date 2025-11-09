/**
 * @purpose Core Competencies（中核的能力）分析のためのルート設定
 */

import express from "express";
import {
  getWeek39RubricAverages,
  getWeekRubricAverages,
} from "../../controllers/analytics/CoreComAnalyticsController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

// === Week 39専用 ===
// Week 39のCore Competencies平均値を取得（認証必須）
router.route("/week39-rubric-averages").get(protect, getWeek39RubricAverages);

// === 汎用版 ===
// 指定WeekのCore Competencies平均値を取得（認証必須）
router.route("/week/:week/rubric-averages").get(protect, getWeekRubricAverages);

export default router;
