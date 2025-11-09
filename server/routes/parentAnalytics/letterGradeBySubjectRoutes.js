import express from "express";
import { getLetterGradesBySubject } from "../../controllers/parentAnalytics/letterGradeBySubjectController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/parent/analytics/letter-grades-by-subject
router.get("/letter-grades-by-subject", protect, getLetterGradesBySubject);

export default router;
 