// server/routes/homeworkRoutes.js

import express from "express";
const router = express.Router();
import { protect, authorize } from "../../middleware/authMiddleware.js";
import { authHomeworkAccess } from "../../middleware/authHomeworkAccess.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

import {
  createHomework,
  updateHomework,
  getHomeworkById,
  deleteHomework,
  getHomeworks,
  getSignedHomeworkDownloadUrl,
} from "../../controllers/model/homeworkController.js";

// Create homework
router.post(
  "/",
  protect,
  authorize(["teacher", "admin"]),
  upload.array("files", 5),
  createHomework
);

router.get("/", protect, getHomeworks);

router.get("/:homeworkId", protect, authHomeworkAccess, getHomeworkById);

router.put(
  "/:homeworkId",
  protect,
  authorize(["teacher", "admin"]),
  authHomeworkAccess,
  upload.array("files", 5),
  updateHomework
);

router.delete(
  "/:homeworkId",
  protect,
  authorize(["teacher", "admin"]),
  authHomeworkAccess,
  deleteHomework
);

// old
router.get(
  "/:homeworkId/download-url/:s3KeyParam",
  protect,
  authHomeworkAccess,
  getSignedHomeworkDownloadUrl
);

// new
router.get(
  "/:homeworkId/download-url",
  protect,
  authHomeworkAccess,
  getSignedHomeworkDownloadUrl
);

export default router;
