import asyncHandler from "express-async-handler";
import User from "../../models/userModel.js";

const listUsersForGroupCreation = asyncHandler(async (req, res) => {
  if (req.user.role !== "teacher") {
    res.status(403); // Forbidden
    throw new Error("Not authorized to perform this action.");
  }

  // Find all users who are not admins to populate the "Choose Students" list.
  const users = await User.find({ role: { $ne: "admin" } }).select(
    "_id profile.firstName profile.lastName role"
  );

  res.status(200).json(users);
});

export { listUsersForGroupCreation };
