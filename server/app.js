// This is a Node.js server setup using Express.js
// Imports the Express.js framework.
// Express is a minimal web framework for Node.js, used to create RESTful APIs and handle HTTP requests. This import allows the creation of an Express application.
// RESTful APIs (Representational State Transfer) use a standardized set of HTTP methods: GET POST PUT DELETE;
import express from "express";
// imports the dotenv package;
// dotnev loads environmental variables from .env file into process.env
import dotenv from "dotenv";
// cors middleware handle requsets from diff origins; Basically, frontend and backend will hosted in different domain (diff localhost number)
import cors from "cors";
// connectDB function, used to initialize database connection;
import connectDB from "./config/db.js";
// cookie-parser middleware;
// This middleware parses cookies attached to incoming requests, making them available in req.cookies. It’s useful for handling authentication tokens or session data stored in cookies.
import cookieParser from "cookie-parser";
// express-session middleware;
// This middleware manages user sessions, storing session data (e.g., user state) on the server and tracking it via a session ID in a cookie.
import session from "express-session";
// csurf middleware;
// csurf provides Cross-Site Request Forgery (CSRF) protection by generating and validating CSRF tokens, ensuring POST/PUT/DELETE requests are legitimate.
import csurf from "csurf";
// from model
import authRoutes from "./routes/model/authRoutes.js";
import contentRoutes from "./routes/model/contentRoutes.js";
import homeworkRoutes from "./routes/model/homeworkRoutes.js";
import subjectRoutes from "./routes/model/subjectRoutes.js";
import submissionRoutes from "./routes/model/submissionRoutes.js";
import userRoutes from "./routes/model/userRoutes.js";
import weekRoutes from "./routes/model/weekRoutes.js";
import annotationRoutes from "./routes/model/annotationRoutes.js";

// 親ユーザー機能
import parentRoutes from "./routes/parents/parentRoutes.js";
import parentAnalyticsRoutes from "./routes/parentAnalytics/scoreBySubjectRoutes.js";
import letterGradeBySubjectRoutes from "./routes/parentAnalytics/letterGradeBySubjectRoutes.js";
import coreCompBySubjectRoutes from "./routes/parentAnalytics/coreCompBySubjectRoutes.js";
import averageScoreBySubjectRoutes from "./routes/parentAnalytics/averageScoreBySubjectRoutes.js";

// カレンダー機能
import calendarRoutes from "./routes/calendarRoutes.js";

// from task
import adminRoutes from "./routes/task/adminRoutes.js";
import manageWeekRoutes from "./routes/task/manageWeekRoutes.js";
import userSubjectRoutes from "./routes/task/userSubjectRoutes.js";
import chatGroupCreationRoutes from "./routes/task/chatGroupCreationRoutes.js";
import aiPracticeRoutes from "./routes/task/aiPracticeRoutes.js";
import userDBDataRoutes from "./routes/task/userDBData.js";
import announcementRoutes from "./routes/task/announcementRoutes.js";
import profileImageRoutes from "./routes/profileImage.js";

// 出席管理機能 (cherry-picked from attendance feature)
import submissionStatsRoutes from "./routes/analytics/submissionStatsRoutes.js";
import attendanceRoutes from "./routes/analytics/attendanceRoutes.js";
import attendanceManagementRoutes from "./routes/attendance/attendanceRoutes.js";

// バッジ機能
import badgeRoutes from "./routes/badgeRoutes.js";

// Core Competencies機能 (cherry-picked)
import coreComAnalyticsRoutes from "./routes/analytics/CoreComRoutes.js";
import currentWeekRoutes from "./routes/analytics/currentWeekRoutes.js";
import teacherDashboardRoutes from "./routes/analytics/teacherDashboardRoutes.js";
import systemUpdateRoutes from "./routes/systemUpdateRoutes.js";

connectDB();
// Create an Express application instance with express function imported above;
// The express application instance will handle HTTP requests, middleware and routes;
const app = express();

// app.use apply cors middleware;
// Every app.use means add the middleware;
app.use(
  // Notice! cors is configured here;
  cors({
    origin: process.env.CLIENT_ORIGIN_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    // Permits headers like Content-Type (for JSON), Authorization (for auth tokens), and X-CSRF-Token (for CSRF protection).
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "Cookie"],
    // Allows cookies and credentials (credentials = auth tokens) to be sent in cross-origin requests;
    credentials: true,
  })
);
console.log("CORS middleware applied for request");
app.use((req, res, next) => {
  // This middleware runs for every request, logging the HTTP method (e.g., GET, POST) and URL (e.g., /api/users).
  console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
  // pass control to next middleware or route handler
  next();
});

console.log(`Allowed CORS Origin: ${process.env.CLIENT_ORIGIN_URL}`);

// express.json() parses incoming requests with JSON payloads, making the data available in req.body. This is essential for handling POST/PUT requests with JSON data (e.g., { "title": "Lecture Notes" }).
// the json code coming in can be found in req.body;
app.use(express.json());
// Added by Francisco, to upload files to AWS S3 for the announcement feature;
app.use(express.urlencoded({ extended: true }));
// Parse the cookies from incoming requests. Create and populate req.cookies with key-value pairs
// For session cookies and CSRF tokens
app.use(cookieParser());

// configure session middleware to manage user sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "Lax",
    },
  })
);

// initialize CSRF protection middleware;
// csurf generate and validate CSRF tokens to prevent unauthorized POST/PUT/DELETE requests
const csrfProtection = csurf({ cookie: true });

// From here 0610;
app.get("/api/csrf-token", (req, res) => {
  try {
    // Generate CSRF token without the middleware for this specific endpoint
    const csrfToken = req.csrfToken
      ? req.csrfToken()
      : "csrf-token-placeholder";
    res.json({ csrfToken: csrfToken });
  } catch (error) {
    console.error("CSRF token generation error:", error);
    res.status(500).json({ error: "Failed to generate CSRF token" });
  }
});

// From Model
app.use("/api/auth", authRoutes);
app.use("/api/contents", contentRoutes);
app.use("/api/homeworks", homeworkRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/weeks", weekRoutes);
app.use("/api", profileImageRoutes);
app.use("/api/annotations", annotationRoutes);

// 親ユーザー機能
app.use("/api/parents", parentRoutes);
app.use("/api/parent/analytics", parentAnalyticsRoutes);
app.use("/api/parent/analytics", letterGradeBySubjectRoutes);
app.use("/api/parent/analytics", coreCompBySubjectRoutes);
app.use("/api/parent/analytics", averageScoreBySubjectRoutes);

// カレンダー機能
app.use("/api/calendar", calendarRoutes);

// Analytics & Attendance (cherry-picked from attendance feature)
// 注意: より具体的なルートを先に登録する必要があります
app.use("/api/analytics/core-competencies", coreComAnalyticsRoutes);
app.use("/api/analytics/attendance", attendanceRoutes);
app.use("/api/analytics/current-week", currentWeekRoutes);
app.use("/api/analytics", submissionStatsRoutes);
app.use("/api/analytics/teacher", teacherDashboardRoutes);
app.use("/api/attendance", attendanceManagementRoutes);

// バッジ機能
app.use("/api", badgeRoutes);

// From Task
app.use("/api/admin", adminRoutes);
app.use("/api/manage-weeks", manageWeekRoutes);
app.use("/api/user-subjects", userSubjectRoutes);
// Any routes that start with /api/ai-practices will be handled by aiPracticeRoutes
app.use("/api/ai-practice", aiPracticeRoutes);
app.use("/api/userDBData/", userDBDataRoutes);
app.use("/api/announcements", announcementRoutes);
// 0618-Francisco added END
app.use("/api/system", systemUpdateRoutes);
app.use("/api/group-creation", chatGroupCreationRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    res.status(403).json({ message: "Invalid CSRF Token" });
  } else {
    next(err);
  }
});

export default app;
