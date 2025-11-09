// server/controllers/model/subjectController.js
/**
 * @purpose Handles API requests for subjects, providing functions to retrieve all subjects or a specific subject by ID.
 */

import asyncHandler from "express-async-handler";
import Subject from "../../models/subjectModel.js";
import mongoose from "mongoose";

const getAllSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({});
  res.status(200).json(subjects);
});

const getSubjectById = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;

  const subject = await Subject.findById(subjectId);

  if (!subject) {
    res.status(404);
    throw new Error("Subject not found.");
  }

  res.status(200).json(subject);
});

const updateSubjectDescription = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const { description } = req.body;

  if (!mongoose.Types.ObjectId.isValid(subjectId)) {
    res.status(400);
    throw new Error("Invalid subject ID format.");
  }

  const updatedSubject = await Subject.findByIdAndUpdate(
    subjectId,
    { description: description },
    { new: true, runValidators: true }
  );

  if (!updatedSubject) {
    res.status(404);
    throw new Error("Subject not found.");
  }

  res.status(200).json(updatedSubject);
});

export { getAllSubjects, getSubjectById, updateSubjectDescription };
