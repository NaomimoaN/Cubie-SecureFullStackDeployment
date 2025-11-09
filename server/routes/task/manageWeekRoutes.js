// server/routes/manageWeekRoutes.js

import express from "express";
const router = express.Router();
import { protect, authorize } from "../../middleware/authMiddleware.js";
import * as manageWeekController from "../../controllers/task/manageWeekController.js";

router.put(
  "/:id",
  protect,
  authorize(["teacher", "admin"]),
  manageWeekController.updateWeek
);

// 現在の週を取得（全ユーザー）
router.get("/current", protect, manageWeekController.getCurrentWeek);

// 現在の週を設定（管理者のみ）
router.post(
  "/current",
  protect,
  authorize(["admin"]),
  manageWeekController.setCurrentWeek
);

export default router;
