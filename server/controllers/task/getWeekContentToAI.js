import Week from "../../models/weekModel.js";
import User from "../../models/userModel.js";
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";

const getWeekContent = asyncHandler(async (req, res) => {
  const week = req.query.week;
  const subjectId = req.query.subjectId;
  // should week1, week2 or week7
  // console.log("getWeekContentToAIController Line9:", week, "a!n+d", subjectId);

  // Remove the week number prefix if it exists
  // the ^ anchor matches the start of the string, and week is the prefix we want to remove
  const weekTrimmed = week.replace(/^week/, ""); //week7 will be 7;
  // console.log("getWeekContentToAIController Line12:", weekTrimmed);

  try {
    // Search for documents with matching week and subject fields
    const weekContent = await Week.findOne({ weekNumber: weekTrimmed, subject: subjectId });

    if (!weekContent) {
      res.status(404).json({ message: "Content not found for the specified week and subject" });
      return;
    }

    res.status(200).json(weekContent);
  } catch (error) {
    console.error("Error fetching week content:", error);
    res.status(500).json({ message: "Server error" });
  }
})

export default getWeekContent;