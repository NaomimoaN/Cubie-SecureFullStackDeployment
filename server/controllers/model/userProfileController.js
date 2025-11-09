// server/controllers/model/userProfileController.js
/**
 * @purpose Manages user profile operations such as profile picture updates, password changes,
 * and notification settings preferences.
 */

import asyncHandler from "express-async-handler";
import User from "../../models/userModel.js";
import { generateSignedUrl } from "../../services/s3Service.js";

const updateProfilePicture = asyncHandler(async (req, res) => {
  // req.file is available because of the multer middleware
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Get file details from multer-s3
    const s3Key = req.file.key; // This is the S3 key (path)
    const profilePictureUrl = req.file.location; // Keep the original location for storage

    console.log("File upload details:", {
      s3Key,
      profilePictureUrl,
      fileKey: req.file.key,
      fileLocation: req.file.location,
    });

    // Update user profile with S3 key (we'll generate signed URLs when needed)
    if (!user.profile) {
      user.profile = {};
    }
    user.profile.profilePictureUrl = profilePictureUrl;
    user.profile.profilePictureKey = s3Key; // Store the S3 key for signed URL generation
    await user.save();

    console.log("User profile updated with keys:", {
      profilePictureUrl: user.profile.profilePictureUrl,
      profilePictureKey: user.profile.profilePictureKey,
    });

    // Generate a signed URL for immediate display
    const signedUrl = await generateSignedUrl(s3Key);
    console.log("Generated signed URL for immediate display:", signedUrl);

    res.json({
      success: true,
      profilePictureUrl: signedUrl, // Return signed URL for immediate display
      message: "Profile picture updated successfully",
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to update profile picture: ${error.message}`);
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current password and new password are required");
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({
          field: "currentPassword",
          message: "Current password is incorrect",
        });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({
          field: "newPassword",
          message: "New password must be at least 6 characters",
        });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to change password: ${error.message}`);
  }
});

const updateNotificationSettings = asyncHandler(async (req, res) => {
  const settings = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Update notification settings
    if (!user.notificationSettings) {
      user.notificationSettings = {};
    }

    // Save each setting to user's preferences
    Object.keys(settings).forEach((key) => {
      user.notificationSettings[key] = settings[key];
    });

    await user.save();

    res.json({
      success: true,
      settings: user.notificationSettings,
      message: "Notification settings updated successfully",
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to update notification settings: ${error.message}`);
  }
});

const updateAvatarUrl = asyncHandler(async (req, res) => {
  const { avatarUrl } = req.body;

  if (!avatarUrl) {
    res.status(400);
    throw new Error("Avatar URL is required");
  }

  try {
    // Use findByIdAndUpdate to avoid full document validation
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { "profile.avatarUrl": avatarUrl } },
      { new: true, runValidators: false }
    );

    if (!updatedUser) {
      res.status(404);
      throw new Error("User not found");
    }

    res.json({
      success: true,
      avatarUrl: updatedUser.profile?.avatarUrl,
      message: "Avatar updated successfully",
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to update avatar: ${error.message}`);
  }
});

export { updateProfilePicture, changePassword, updateNotificationSettings, updateAvatarUrl };
