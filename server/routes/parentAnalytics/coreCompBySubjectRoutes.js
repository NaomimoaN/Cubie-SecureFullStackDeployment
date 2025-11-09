import express from "express";
import {
  getCoreCompetenciesBySubject,
  getYearlyCoreCompBySubject,
} from "../../controllers/parentAnalytics/coreComBySubjectController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/parent/analytics/core-competencies-by-subject
router.get(
  "/core-competencies-by-subject",
  protect,
  getCoreCompetenciesBySubject
);

// GET /api/parent/analytics/yearly-core-comp/:studentId
router.get("/yearly-core-comp/:studentId", protect, getYearlyCoreCompBySubject);

export default router;
