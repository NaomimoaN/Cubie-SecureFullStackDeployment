import { sendSystemUpdateNotification } from "../utils/notificationHelper.js";
import asyncHandler from "express-async-handler";

// @desc    Send system update notification to users
// @route   POST /api/system/notify-update
// @access  Admin only (should be restricted to admin users)
const notifySystemUpdate = asyncHandler(async (req, res) => {
  const { version, message, updateType, releaseNotes } = req.body;

  try {
    // Validate required fields
    if (!version) {
      return res.status(400).json({
        success: false,
        message: "Version is required for system update notification"
      });
    }

    const updateData = {
      version,
      message: message || `System has been updated to version ${version}. New features and improvements are now available.`,
      updateType: updateType || "general",
      releaseNotes: releaseNotes || null,
      _id: Date.now() // Generate a unique ID for this update
    };

    // Send notification to all users based on their system update preferences
    await sendSystemUpdateNotification(updateData);

    console.log(`System update notification sent for version ${version}`);

    res.status(200).json({
      success: true,
      message: "System update notification sent successfully",
      updateData
    });

  } catch (error) {
    console.error("Error sending system update notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send system update notification",
      error: error.message
    });
  }
});

// @desc    Get system update history (placeholder for future implementation)
// @route   GET /api/system/updates
// @access  Public
const getSystemUpdates = asyncHandler(async (req, res) => {
  // This could be expanded to store and retrieve system update history
  // For now, return a simple response
  res.status(200).json({
    success: true,
    message: "System updates endpoint",
    updates: [
      {
        version: "1.0.0",
        date: new Date().toISOString(),
        message: "Initial system release",
        updateType: "major"
      }
    ]
  });
});

export {
  notifySystemUpdate,
  getSystemUpdates
};