/**
 * @purpose 現在の週を取得するためのルート設定
 */

import express from "express";
import {
  getCurrentWeek,
  getCurrentTerm,
} from "../../controllers/analytics/currentWeekController.js";

const router = express.Router();

// 現在の週を取得（認証不要）
router.route("/").get(getCurrentWeek);

// 現在の学期を取得（認証不要）
router.route("/term").get(getCurrentTerm);

export default router;
