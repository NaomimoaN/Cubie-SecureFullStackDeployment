import express from "express";
const router = express.Router();
import { protect, authorize } from "../../middleware/authMiddleware.js";
import { authHomeworkAccess } from "../../middleware/authHomeworkAccess.js";
import { authSubmissionAccess } from "../../middleware/authSubmissionAccess.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

import * as submissionController from "../../controllers/model/submissionController.js";

router.post(
  "/:homeworkId/submit",
  protect,
  authorize(["student"]),
  authHomeworkAccess,
  upload.array("files", 5),
  submissionController.submitHomework
);

router.get(
  "/:submissionId",
  protect,
  authSubmissionAccess,
  submissionController.getSubmissionById
);

router.put(
  "/:submissionId",
  protect,
  authorize(["student"]),
  authSubmissionAccess,
  upload.array("files", 5),
  submissionController.updateSubmission
);

router.delete(
  "/:submissionId",
  protect,
  authorize(["student"]),
  authSubmissionAccess,
  submissionController.deleteSubmission
);

router.put(
  "/:submissionId/grade",
  protect,
  authorize(["teacher", "admin"]),
  authSubmissionAccess,
  submissionController.updateSubmissionGrade
);

router.get(
  "/:submissionId/display-url/:s3KeyParam",
  protect,
  authSubmissionAccess,
  submissionController.getSignedSubmissionDisplayUrl
);

router.get(
  "/:submissionId/download-url/:s3KeyParam",
  protect,
  authSubmissionAccess,
  submissionController.getSignedSubmissionDownloadUrl
);

router.get(
  "/subject/:subjectId",
  protect,
  authorize(["student", "teacher", "admin"]),
  submissionController.getUserSubmissions
);

router.get(
  "/homework/:homeworkId",
  protect,
  authorize(["teacher", "admin"]),
  submissionController.getSubmissionsByHomeworkId
);

router.get(
  "/user/all",
  protect,
  authorize(["student"]),
  submissionController.getAllUserSubmissions
);

export default router;
