// server/controllers/model/annotationController.js

import asyncHandler from "express-async-handler";
import Annotation from "../../models/annotationModel.js";
import Submission from "../../models/submissionModel.js"; // ★ パスを修正

/**
 * @desc Saves or updates an annotation for a specific submission.
 * @route POST /api/annotations/:submissionId or PUT /api/annotations/:submissionId
 * @access Private (Student, Teacher, Admin)
 */
const saveAnnotation = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { type, data, isFinal } = req.body;
  const owner = req.user._id;

  // Validation
  if (!type || !data) {
    res.status(400);
    throw new Error("Type and data are required for annotation.");
  }
  if (!Array.isArray(data) && typeof data !== "object") {
    res.status(400);
    throw new Error("Annotation data must be an array or an object.");
  }

  // Validate annotation type
  if (!["student", "teacher"].includes(type)) {
    res.status(400);
    throw new Error("Invalid annotation type. Must be 'student' or 'teacher'.");
  }

  // Ensure student can only save 'student' type annotations for themselves
  if (req.user.role === "student" && type === "teacher") {
    res.status(403);
    throw new Error(
      "Forbidden: Students cannot save 'teacher' type annotations."
    );
  }
  // Optional: Ensure teacher can only save 'teacher' type annotations for themselves
  // if (req.user.role === "teacher" && type === "student" && owner.toString() !== req.user._id.toString()) {
  //   res.status(403);
  //   throw new Error("Forbidden: Teachers cannot save 'student' type annotations for others.");
  // }

  // Check if submission exists (authSubmissionAccess middleware handles most of this)
  const submission = await Submission.findById(submissionId);
  if (!submission) {
    res.status(404);
    throw new Error("Submission not found.");
  }

  // Find existing annotation (unique by submission, owner, and type)
  let annotation = await Annotation.findOne({
    submission: submissionId,
    owner: owner,
    type: type,
  });

  if (annotation) {
    // Update existing annotation
    annotation.data = data;
    if (typeof isFinal === "boolean") {
      annotation.isFinal = isFinal;
    }
    await annotation.save();
    // console.log(`Annotation updated for submission ${submissionId}:`, annotation._id);
    res.status(200).json(annotation);
  } else {
    // Create new annotation
    annotation = await Annotation.create({
      submission: submissionId,
      owner: owner,
      type: type,
      data: data,
      isFinal: typeof isFinal === "boolean" ? isFinal : false,
    });
    // console.log(`New annotation created for submission ${submissionId}:`, annotation._id);
    res.status(201).json(annotation);
  }
});

/**
 * @desc Retrieves annotations for a specific submission.
 * @route GET /api/annotations/:submissionId?owner=:ownerId&type=:type
 * @access Private (Student, Teacher, Admin - controlled by authSubmissionAccess)
 */
const getAnnotations = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { owner, type } = req.query; // Get owner and type from query parameters

  let query = { submission: submissionId };

  // Add owner query parameter if provided
  if (owner) {
    query.owner = owner;
  }
  // Add type query parameter if provided
  if (type) {
    query.type = type;
  }

  // Find annotation, sorted by createdAt in descending order to get the latest one
  const annotation = await Annotation.findOne(query)
    .sort({ createdAt: -1 })
    .populate("owner", "profile.firstName profile.lastName role"); // Populate owner info

  if (!annotation) {
    // If no annotation is found, return null (easier for client to handle)
    // console.log(`No annotation found for submission ${submissionId} with query:`, query); // 冗長なログを削除
    return res.status(200).json(null);
  }

  // console.log(`Found annotation for submission ${submissionId}:`, annotation._id); // 冗長なログを削除
  res.status(200).json(annotation);
});

export { saveAnnotation, getAnnotations };
