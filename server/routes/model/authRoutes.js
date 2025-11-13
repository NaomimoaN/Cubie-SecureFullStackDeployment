// server/routes/authRoutes.js

import express from "express";
const router = express.Router();
import * as authController from "../../controllers/model/authController.js";
import * as userProfileController from "../../controllers/model/userProfileController.js";
import { protect } from "../../middleware/authMiddleware.js";
import { profileUpload } from "../../middleware/profileUploadMiddleware.js";

router.post("/login", authController.authUser);

router.post("/admin/login", authController.authUser);

router.post("/register", authController.registerUser);

router.get("/profile", protect, authController.getUserProfile);

router.post("/logout", authController.logoutUser);

// New endpoints
router.post("/change-password", protect, userProfileController.changePassword);

router.post(
  "/update-profile-picture",
  protect,
  profileUpload.single("profilePicture"),
  userProfileController.updateProfilePicture
);

router.post(
  "/update-notification-settings",
  protect,
  userProfileController.updateNotificationSettings
);

router.post("/update-avatar", protect, userProfileController.updateAvatarUrl);

export default router;
