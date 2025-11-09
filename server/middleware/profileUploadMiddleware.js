// server/middleware/profileUploadMiddleware.js
/**
 * @purpose Provides Multer middleware configuration for handling profile picture uploads to AWS S3.
 */

import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import { s3Client, S3_BUCKET_NAME } from "../services/s3Service.js";

// Upload settings for profile pictures
const profileUpload = multer({
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type. Profile pictures must be in one of these formats: ${allowedMimeTypes.join(
            ", "
          )}.`
        ),
        false
      );
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max for profile pictures
  storage: multerS3({
    s3: s3Client,
    bucket: S3_BUCKET_NAME,
    // Remove ACL since bucket doesn't support it
    // acl: "public-read",
    metadata: function (req, file, cb) {
      const userId = req.user ? req.user._id.toString() : "unknown";
      cb(null, { fieldName: file.fieldname, userId: userId });
    },
    key: function (req, file, cb) {
      const userId = req.user ? req.user._id.toString() : "unknown";
      const fileName = `${Date.now()}-${path.basename(file.originalname)}`;
      cb(null, `profile-pictures/${userId}/${fileName}`);
    },
  }),
});

export { profileUpload };
