// server/routes/aiPracticeRoutes.js

// Routes are composed of middlewares and a Handler, which is a controller function
// Use Express.js to set up the endpoints for uploading
import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { getAIQuestions } from "../../controllers/task/trial.js";
import sendDataToAI from "../../controllers/task/backendToAIController.js";
import getWeekContent from "../../controllers/task/getWeekContentToAI.js";
// comment this out when you input the GEMINI_API_KEY in .env file
// import sendDataToAI from "../../controllers/task/backendToAIController.js";
// Initialize a modular router for importUsers endpoint;
const router = express.Router();
// The post router
// Wait a minute
router.post("/questions",
  //   (req, res, next) => {
  //   next(); // Pass control to the `getAIQuestions` controller
  // },
  protect,
  sendDataToAI);

router.get("/weekContent",
  //   (req, res, next) => {
  //   next(); // Pass control to the `getAIQuestions` controller
  // },
  protect,
  getWeekContent);

// router.post("/send-data",
//   protect,
//   sendDataToAI);

export default router;