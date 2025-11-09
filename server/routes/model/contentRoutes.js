// server/routes/contentRoutes.js

import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { authContentAccess } from "../../middleware/authContentAccess.js";
import multer from "multer";

import {
  createContent,
  getContents,
  getContentById,
  updateContent,
  deleteContent,
  getSignedContentUploadUrl,
  getSignedContentDownloadUrl,
} from "../../controllers/model/contentController.js";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Retrieves a specific content item by ID, checking access rights after user authentication.(getContentById)
router.get("/:contentId", protect, authContentAccess, getContentById);

// Fetches a list of content items after user authentication.(getContents)
router.get("/", protect, getContents);

// Handles content creation, including file upload to S3, after user authentication.(createContent)
router.post("/", protect, upload.array("contents"), createContent);

// Updates a specific content item by ID, potentially including file replacement, after user authentication and access check.(updateContent)
router.put(
  "/:contentId",
  protect,
  authContentAccess,
  upload.array("contents"),
  updateContent
);

// Deletes a specific content item by ID, checking access rights after user authentication.(deleteContent)
router.delete("/:contentId", protect, authContentAccess, deleteContent);

// Generates a pre-signed URL for direct content file upload to S3 after user authentication.(getSignedContentUploadUrl)
router.post("/upload-url", protect, getSignedContentUploadUrl);

// Generates a pre-signed URL for content file download from S3, checking access rights after user authentication.(getSignedContentDownloadUrl)
// Old API for downloading
router.get(
  "/:contentId/download-url/:s3KeyParam",
  protect,
  authContentAccess,
  getSignedContentDownloadUrl
);

// New API for downloading(handle s3Key as parameter)
router.get(
  "/:contentId/download-url",
  protect,
  authContentAccess,
  getSignedContentDownloadUrl
);

export default router;
