/**
 * @purpose 親ユーザー専用のAPIルートを定義します。
 * 親が家族学生の情報にアクセスし、進捗を確認するためのエンドポイントを提供します。
 */

import express from "express";
import {
  getFamilyStudents,
  getFamilyStudentById,
  getFamilyStudentProgress,
  updateParentProfile,
} from "../../controllers/parents/parentController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

// すべてのルートで認証が必要
router.use(protect);

// 親の家族学生一覧を取得
router.get("/family-students", getFamilyStudents);

// 特定の家族学生の詳細情報を取得
router.get("/family-students/:studentId", getFamilyStudentById);

// 家族学生の進捗状況を取得
router.get("/family-students/:studentId/progress", getFamilyStudentProgress);

// 親のプロフィール更新
router.put("/profile", updateParentProfile);

export default router;
