import express from "express";
import { getScoresBySubject } from "../../controllers/parentAnalytics/scoreBySubjectController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route GET /api/parent/analytics/scores-by-subject
 * @desc 親の子供の科目別平均点を取得
 * @access Private (Parent only)
 */
router.get("/scores-by-subject", protect, getScoresBySubject);

export default router;
 