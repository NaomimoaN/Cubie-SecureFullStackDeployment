// server/middleware/authSubmissionAccess.js
/**
 * @purpose A middleware that authenticates and authorizes user access to specific homework submissions.
 * It validates submission and homework IDs, verifies the user's role, and their relation to the submission (student)
 * or the associated homework (teacher/admin). If authorized, it attaches the submission object to the request.
 */

import asyncHandler from "express-async-handler";
import Submission from "../models/submissionModel.js";
import Homework from "../models/homeworkModel.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";

const authSubmissionAccess = asyncHandler(async (req, res, next) => {
  const { submissionId, homeworkId } = req.params; // Get submissionId and homeworkId from parameters
  const user = req.user; // User information set by the protect middleware

  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    res.status(400);
    throw new Error("Invalid submission ID.");
  }

  let submission;
  try {
    submission = await Submission.findById(submissionId)
      .populate("homework") // Populate associated homework information
      .populate("student"); // Populate submitting student information
  } catch (error) {
    console.error("Error finding submission in authSubmissionAccess:", error);
    res.status(500);
    throw new Error("Failed to retrieve submission for access check.");
  }

  if (!submission) {
    res.status(404);
    throw new Error("Submission not found.");
  }

  // Store the submission document in req
  req.submission = submission;

  // Optionally, check if the homeworkId in the URL matches the homework reference in the submission
  if (homeworkId && submission.homework._id.toString() !== homeworkId) {
    res.status(400);
    throw new Error("Submission does not belong to the specified homework.");
  }

  // Access control logic
  // 1. Admin (admin) has access to all submissions
  if (user.role === "admin") {
    return next();
  }

  // 2. Teacher (teacher) can access submissions for homework associated with their subjects or homework they uploaded
  if (user.role === "teacher") {
    // Check homework access (similar to authHomeworkAccess logic)
    // Re-checking homework here might be redundant but is done for safety
    const homework = await Homework.findById(submission.homework._id)
      .populate("subject")
      .populate("uploadedBy");

    if (!homework) {
      // e.g., if homework was deleted
      res.status(404);
      throw new Error("Associated homework not found for this submission.");
    }

    const teacher = await User.findById(user._id).populate("assignedSubjects");

    const isAssignedSubject = teacher.assignedSubjects.some((assignedSubject) =>
      assignedSubject._id.equals(homework.subject._id)
    );
    const isUploader = homework.uploadedBy._id.equals(user._id);

    if (isAssignedSubject || isUploader) {
      return next();
    } else {
      res.status(403);
      throw new Error("Forbidden: You do not have access to this submission.");
    }
  }

  // 3. Student (student) can only access their own submissions
  if (user.role === "student") {
    if (submission.student._id.equals(user._id)) {
      return next();
    } else {
      res.status(403);
      throw new Error("Forbidden: You can only access your own submissions.");
    }
  }

  // If no role matches or access was not granted by the above rules
  res.status(403);
  throw new Error(
    "Forbidden: Your role does not have access to this submission."
  );
});

export { authSubmissionAccess };
