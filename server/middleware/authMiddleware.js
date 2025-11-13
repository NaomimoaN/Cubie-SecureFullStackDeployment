// server/middleware/authMiddleware.js
/**
 * @purpose Provides authentication and authorization middleware for protected routes.
 * The `protect` middleware verifies JWT tokens from cookies or Authorization header (Bearer token)
 * and populates user data (including registered and assigned subjects).
 * The `authorize` middleware restricts access based on allowed user roles.
 */

import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // ✅ Cookie からトークンを取得（既存機能）
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // ✅ Authorization ヘッダーからトークンを取得（新規追加）
  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Populate registeredSubjects, assignedSubjects, and familyStudents
      req.user = await User.findById(decoded.id)
        .select("-password")
        .populate("registeredSubjects")
        .populate("assignedSubjects")
        .populate("familyStudents");

      if (!req.user) {
        res.status(401);
        throw new Error("Not authorized, user not found");
      }

      next();
    } catch (error) {
      console.error("Not authorized, token failed:", error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }
});

const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (req.user && allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403);
      throw new Error("Not authorized for this role");
    }
  };
};

export { protect, authorize };
