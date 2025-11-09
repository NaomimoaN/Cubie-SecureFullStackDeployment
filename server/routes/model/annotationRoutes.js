// server/routes/model/annotationRoutes.js

import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { authSubmissionAccess } from "../../middleware/authSubmissionAccess.js";
import {
  saveAnnotation,
  getAnnotations,
} from "../../controllers/model/annotationController.js";

const router = express.Router();

// Saves or updates annotations for a specific submission
// Uses POST and PUT for the same path and controller.
// authSubmissionAccess middleware verifies user access to this submission.
router
  .route("/:submissionId")
  .post(protect, authSubmissionAccess, saveAnnotation)
  .put(protect, authSubmissionAccess, saveAnnotation)
  .get(protect, authSubmissionAccess, getAnnotations);

export default router;
