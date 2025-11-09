import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import "./models/User.js";

// Import Routes
import groupRoutes from "./routes/groupRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

connectDB();

const app = express();

// CORS settings
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Log middleware
app.use((req, res, next) => {
  console.log(
    `Incoming request to chat server: ${req.method} ${req.originalUrl}`
  );
  next();
});

// API Routes
app.use("/api/groups", groupRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Chat API is running...");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "production" ? {} : err.toString(),
  });
});

export default app;
