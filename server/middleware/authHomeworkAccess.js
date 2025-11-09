// server/middleware/authHomeworkAccess.js
/**
 * A middleware that authenticates and authorizes user access to specific homework documents.
 * It verifies the user's role and their relation to the homework's subject or uploader.
 * If authorized, it attaches the homework object to the request for subsequent handlers.
 */

import asyncHandler from "express-async-handler";
import Homework from "../models/homeworkModel.js";
import User from "../models/userModel.js";
import mongoose from "mongoose";

const authHomeworkAccess = asyncHandler(async (req, res, next) => {
  const { homeworkId } = req.params;
  const user = req.user;

  if (!user) {
    res.status(401);
    throw new Error("Not authorized, no user data in request.");
  }

  if (!mongoose.Types.ObjectId.isValid(homeworkId)) {
    res.status(400);
    throw new Error("Invalid homework ID.");
  }

  let homework;
  try {
    // Search for the homework document and populate related information
    homework = await Homework.findById(homeworkId)
      .populate("subject")
      .populate("uploadedBy")
      .populate("files");
  } catch (error) {
    console.error("Error finding homework in authHomeworkAccess:", error);
    res.status(500);
    throw new Error("Failed to retrieve homework for access check.");
  }

  if (!homework) {
    res.status(404);
    throw new Error("Homework not found.");
  }

  // Store the homework document in req for subsequent middleware or controllers.
  req.homework = homework;

  // Access control logic
  // 1. Admin users have access to all homework
  if (user.role === "admin") {
    return next();
  }

  // 2. Teacher access control
  if (user.role === "teacher") {
    const teacher = await User.findById(user._id).populate("assignedSubjects");

    if (
      !teacher ||
      !teacher.assignedSubjects ||
      teacher.assignedSubjects.length === 0
    ) {
      res.status(403);
      throw new Error("Forbidden: Teacher has no assigned subjects.");
    }

    const isAssignedSubject = teacher.assignedSubjects.some(
      (assignedSubject) =>
        assignedSubject._id.toString() === homework.subject._id.toString()
    );
    const isUploader =
      homework.uploadedBy._id.toString() === user._id.toString();

    if (isAssignedSubject || isUploader) {
      return next();
    } else {
      res.status(403);
      throw new Error("Forbidden: You do not have access to this homework.");
    }
  }

  // 3. Student access control
  if (user.role === "student") {
    const student = await User.findById(user._id).populate(
      "registeredSubjects"
    );

    if (
      !student ||
      !student.registeredSubjects ||
      student.registeredSubjects.length === 0
    ) {
      res.status(403);
      throw new Error("Forbidden: Student has no registered subjects.");
    }

    const isRegisteredSubject = student.registeredSubjects.some(
      (registeredSubject) => {
        return (
          registeredSubject?._id &&
          homework.subject?._id &&
          registeredSubject._id.toString() === homework.subject._id.toString()
        );
      }
    );

    const isPublished = homework.status === "published";

    if (isRegisteredSubject && isPublished) {
      return next();
    } else {
      res.status(403);
      throw new Error("Forbidden: You do not have access to this homework.");
    }
  }

  // If no role matches or access is not granted by the above rules
  res.status(403);
  throw new Error(
    "Forbidden: Your role does not have access to this resource."
  );
});

export { authHomeworkAccess };
