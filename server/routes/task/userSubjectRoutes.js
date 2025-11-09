import express from "express";
import { protect, authorize } from "../../middleware/authMiddleware.js";
import * as userSubjectController from "../../controllers/task/userSubjectController.js";

const router = express.Router();

router.get(
  "/assigned-subjects",
  protect,
  authorize(["teacher"]),
  userSubjectController.getTeacherSubjects
);

router.get(
  "/registered-subjects",
  protect,
  authorize(["student"]),
  userSubjectController.getStudentSubjects
);

router.get(
  "/registered-subjects/:userId",
  protect,
  authorize(["parent", "admin"]),
  userSubjectController.getStudentSubjectsById
);

export default router;
