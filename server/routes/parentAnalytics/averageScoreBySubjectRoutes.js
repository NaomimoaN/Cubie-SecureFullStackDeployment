import express from "express";
import { getAverageScoresBySubject } from "../../controllers/parentAnalytics/avarageScoreBySubjectController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route GET /api/parent/analytics/average-scores-by-subject
 * @desc 親の子供のterm別科目別平均点を取得
 * @access Private (Parent only)
 */
router.get("/average-scores-by-subject", protect, getAverageScoresBySubject);

export default router;
