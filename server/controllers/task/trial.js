// This file will only fetch data from MongoDB and will NOT contact with Gemini API
import asyncHandler from "express-async-handler";
import User from "../../models/userModel.js";
import Week from "../../models/weekModel.js";

const getAIQuestions = asyncHandler(async (req, res) => {
  // const studentId = req.user.id;
  const { subjectName, grade } = req.query; // Extract query parameters

  const jsonSim = {
    "question": `${subjectName} question for grade ${grade}`,
    "options": ["Berlin", "Madrid", "Paris", "Rome"],
    "correctAnswer": "Paris",
    "explanation": "The capital of France is Paris, known for its art, fashion, and culture."
  };

  if (!jsonSim) {
    res.status(404);
    throw new Error("No AI questions available.");
  }

  res.status(200).json(jsonSim);
});

export { getAIQuestions };