import express from "express";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByDateRange,
  getEventsByCategory,
  toggleEventVisibilityForParents,
} from "../controllers/calendarController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 全ルートで認証が必要
router.use(protect);

// より具体的なルートを先に配置
// 日付範囲内のイベントを取得
router.get("/events/range", getEventsByDateRange);

// カテゴリ別のイベントを取得
router.get("/events/category", getEventsByCategory);

// 全イベントの取得
router.get("/events", getAllEvents);

// 新しいイベントの作成（Teacherのみ）
router.post("/events", createEvent);

// 特定のイベントの取得
router.get("/events/:id", getEventById);

// イベントの更新（Teacherのみ）
router.put("/events/:id", updateEvent);

// イベントの削除（Teacherのみ）
router.delete("/events/:id", deleteEvent);

// 親向けの非表示設定を切り替え（Teacherのみ）
router.patch("/events/:id/toggle-visibility", toggleEventVisibilityForParents);

export default router;
