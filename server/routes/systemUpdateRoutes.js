import express from "express";
import { notifySystemUpdate, getSystemUpdates } from "../controllers/systemUpdateController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// @desc    Send system update notification
// @route   POST /api/system/notify-update
// @access  Protected (should be admin only in production)
router.post("/notify-update", protect, notifySystemUpdate);

// @desc    Get system updates
// @route   GET /api/system/updates
// @access  Public
router.get("/updates", getSystemUpdates);

export default router;