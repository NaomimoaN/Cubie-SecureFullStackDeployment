// server/middleware/authContentAccess.js
/**
 * @purpose A middleware that authenticates and authorizes user access to specific content documents.
 * It verifies the user's role and their relation to the content's subject or uploader.
 * If authorized, it attaches the content object to the request for subsequent handlers.
 */

import asyncHandler from "express-async-handler";
import Content from "../models/contentModel.js";
import Subject from "../models/subjectModel.js";

const authContentAccess = asyncHandler(async (req, res, next) => {
  const { contentId } = req.params;
  const user = req.user;
  if (!user) {
    res.status(401);
    throw new Error("Unauthorized: Please log in.");
  }

  const content = await Content.findById(contentId).populate({
    path: "subject",
    select: "teacher students",
  });

  if (!content) {
    res.status(404);
    throw new Error("Content not found.");
  }

  let authorized = false;

  if (user.role === "teacher") {
    if (
      content.uploadedBy.toString() === user._id.toString() ||
      (content.subject &&
        content.subject.teacher &&
        content.subject.teacher.toString() === user._id.toString())
    ) {
      authorized = true;
    }
  } else if (user.role === "student") {
    if (
      content.subject &&
      content.subject.students &&
      content.subject.students
        .map((s) => s.toString())
        .includes(user._id.toString())
    ) {
      authorized = true;
    }
  } else if (user.role === "admin") {
    authorized = true;
  }

  if (!authorized) {
    res.status(403);
    throw new Error(
      "Forbidden: You do not have permission to access this content."
    );
  }

  // If authorization is successful, pass the content object to the next middleware or route handler.
  req.content = content; // Avoid re-fetching the Content object in the controller.
  next();
});

export { authContentAccess };
