// express library is a web application FRAMEWORK for Node.js to simplify building robust API & Web server.
// express library is actually inside the node_modules, the one inside the server folder;
// import express from 'express';
// @google/generative-ai is the google Node.js SDK
import { GoogleGenerativeAI } from '@google/generative-ai';
import asyncHandler from "express-async-handler";
// bodyParser and cors are for AI;
// Remember to install body-parser later;
// import bodyParser from 'body-parser';
// import cors from 'cors';

// The app const is for AI purpose;
// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// Create a new instance / Object of Express Router;
// This router object holds all routes to AI functionality;
// const router = express.Router();

// (ensure dotenv is CONFIGURED in app.js or server.js)
// process.env is a global Node.js object;
const API_KEY = process.env.GEMINI_API_KEY;
// const API_KEY = "abc";

if (!API_KEY) {
  console.error("GEMINI_API_KEY not found in environment variables. Please set it in your .env file.");
  // Optionally, you could exit the process to prevent failed AI calls. GOOD PRACTICE;
  // Here the process comes from NodeJS.process. NodeJs could be a global object;
  process.exit(1);
}

// genAI is the object to interact with Gemini API. It encapsulates all authentication details and provides method to access its models;
const genAI = new GoogleGenerativeAI(API_KEY);
// This model object is used to send and receive message.
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // You can use "gemini-pro" for text-only, or "gemini-pro-vision" for multimodal

// The following code is the heart of AI interaction;
// The Express Router object will handle HTTP POST requests; POST requests mean you send data to the server;
// '/chat' is the path for this route relative to router's base path;
// In app.js, if you write app.use('/api/ai', aiRoutes); the full URL of this endpoint will be /api/ai/chat
// async (req, res) is the route handler function; request object and response object
// req obj contain the information from the HTTP request user sent to database;
// res object is used to send a response back to client side (frontend)
const sendDataToAI = asyncHandler(async (req, res) => {
  try {
    // req.body contains the data from frontend.
    // In app.js, you need app.use(express.json()); Express will parses incoming JSON data;
    const { subjectName, grade, weekContentDescription } = req.body;
    console.log("Line50-BtoA-Just want to Double check ", { subjectName, grade, weekContentDescription });
    // { message, history } is JS destructure. The whole thing will extract properties named message and history and then assign each to new message and history variables;
    // const { message, history } = req.body; // 'message' is the user's new input, 'history' is previous conversation

    // !!!!this startPrompt is under construction, the grade must be passed from the database via backend;
    let startPrompt = `Generate five unique multiple choice questions to help a ${grade} grade student to practice ${subjectName} subject. The course content is about: ${weekContentDescription}. Return with format like this:
    
    q01s"Which number correctly completes the subtraction sentence 5.0 - 3.25?"q01e,
    o01s"1.25"o01e,
    o02s"1.75"o02e,
    o03s"2.25"o03e,
    o04s"2.75"o04e,
    c01s"1.75"c01e,
    e01s"To find the answer, subtract 3.25 from 5.0."e01e
    
    To wrap the second part of the question, replace the 0 with 1 in the tags such as q11s, q11e, o11s, o11e, o12s, o12e, o13s, o13e, o14s, o14e, c11s, c11e, e11s, e11e.
    For the third question, replace the 0 with 2 in the tags such as q21s, q21e, o21s, o21e, o22s, o22e, o23s, o23e, o24s, o24e, c21s, c21e, e21s, e21e.
    Use this pattern for all ten questions.
    `
    if (!startPrompt || typeof startPrompt !== 'string' || startPrompt.trim().length === 0) {
      // When the message is empty, or maybe I should also check the message lenght at the frontend
      // the return will end the execution.
      // give a status of 400 and a json reponse;
      return res.status(400).json({ error: 'Invalid message! Message must be a non-empty string.' });
    }

    // Validation to history;
    // if (!Array.isArray(history)) {
    //   return res.status(400).json({ error: 'Invalid history! History must be an array.' });
    // }

    // 20250630-Forget About the history;
    // Gemini API expects chat history in the specific  following format:
    // Convert your chat history (e.g., [{ role: 'user', text: '...' }, { role: 'model', text: '...' }])
    // into Gemini's format: [{ role: 'user', parts: [{ text: '...' }] }, { role: 'model', parts: [{ text: '...' }] }]
    // const formattedHistory = history.map(msg => ({
    //   // The role must either be 'user' or 'model'
    //   role: msg.role === 'user' ? 'user' : 'model', // Gemini uses 'model' for AI responses
    //   // parts is an array, with each part containing a text property;
    //   parts: [{ text: msg.text }]
    // }));

    // initiate a new chat session with the model you selected above;
    // const chat = model.startChat({
    //   // pass the whole chat history to AI so that it will understand what happened;
    //   history: formattedHistory,
    //   // generationConfig: {
    //   //   maxOutputTokens: 100, // Optional: limit response length
    //   // },
    // });

    // result object means the result from Gemini;
    const result = await model.generateContent(startPrompt);
    // console.log(result, Gemini result object);
    const response = result.response;
    // console.log("Gemini response object", response); //working
    // text() can extra only the text part among all types of response e.g. images, video;
    const text = response.text();
    // console.log("Gemini response text:", text); //working

    // send the aiResponse back to the react frontend; aka client side;
    res.json(text);

  } catch (error) {
    // The error message only appears in backend;
    console.error("Error calling Gemini API:", error);
    // Log the full error to see details, especially if it's an API error
    // error.response will contain the detail of error
    if (error.response) {
      console.error("Gemini API Error Response Data:", error.response.data);
    }
    // Remember res is always send back to client side with something;
    res.status(500).json({ error: "Failed to get AI response." });
  }
});

export default sendDataToAI;