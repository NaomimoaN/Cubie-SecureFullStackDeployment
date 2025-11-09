/**
 * @purpose Handles API requests for retrieving and managing academic weeks.
 * It provides functions to fetch weeks by subject ID and retrieve specific week details by week ID.
 */

import Week from "../../models/weekModel.js";
import Subject from "../../models/subjectModel.js";
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";

const getWeeksBySubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.query;

  if (!subjectId) {
    res.status(400);
    throw new Error("Subject ID is required.");
  }

  if (!mongoose.Types.ObjectId.isValid(subjectId)) {
    res.status(400);
    throw new Error("Invalid Subject ID format.");
  }

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    res.status(404);
    throw new Error("Subject not found.");
  }

  const weeks = await Week.find({ subject: subjectId })
    .sort({ weekNumber: 1 })
    .select("weekNumber title description _id term weekNumOfTerm");
  res.status(200).json(weeks);
});

const getWeekById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid Week ID format.");
  }

  const week = await Week.findById(id).select(
    "weekNumber title description _id"
  );
  if (!week) {
    res.status(404);
    throw new Error("Week not found.");
  }

  res.status(200).json(week);
});

const updateWeekContent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid Week ID format.");
  }

  try {
    const week = await Week.findById(id);

    if (!week) {
      res.status(404);
      throw new Error("Week not found.");
    }

    if (title !== undefined) {
      week.title = title;
    }

    if (description !== undefined) {
      week.description = description;
    }

    const updatedWeek = await week.save();

    res.status(200).json({
      _id: updatedWeek._id,
      weekNumber: updatedWeek.weekNumber,
      title: updatedWeek.title,
      description: updatedWeek.description,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update week content.",
      error: error.message,
    });
  }
});

export { getWeeksBySubject, getWeekById, updateWeekContent };
