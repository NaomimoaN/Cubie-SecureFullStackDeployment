import express from "express";
import {
  getGroupMessages,
  getRecentMessages,
} from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get messages for a specific group with pagination
router.get("/group/:groupId", getGroupMessages);

// Get recent messages for a group (last 20 messages)
router.get("/group/:groupId/recent", getRecentMessages);

export default router;
