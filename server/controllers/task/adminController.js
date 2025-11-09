// server/controllers/task/adminController.js
/**
 * @purpose Handles administrative tasks, specifically importing users from a provided data set.
 * It validates user data, checks for existing users, and creates new user records with assigned roles and profiles.
 * It also reports on the success and failure of individual user imports.
 */

import asyncHandler from "express-async-handler";
import User from "../../models/userModel.js";

export const importUsers = asyncHandler(async (req, res) => {
  const usersToImport = req.body.users;

  if (
    !usersToImport ||
    !Array.isArray(usersToImport) ||
    usersToImport.length === 0
  ) {
    res.status(400);
    throw new Error("No user data for importing");
  }

  const importedUsersDetails = [];
  const errors = [];

  for (const userData of usersToImport) {
    try {
      if (!userData.email || !userData.password || !userData.role) {
        throw new Error("Email, Password, Role are required");
      }
      const userExists = await User.findOne({ email: userData.email });
      if (userExists) {
        throw new Error(`'${userData.email}' is existing`);
      }

      const newUser = await User.create({
        email: userData.email,
        password: userData.password,
        role: userData.role,

        profile: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          grade: userData.role === "student" ? userData.grade || null : null,
          parent_id:
            userData.role === "student" ? userData.parent_id || null : null,
          teacher_id:
            userData.role === "student" || userData.role === "parent"
              ? userData.teacher_id || null
              : null,
          profilePictureUrl: userData.profilePictureUrl || null,
          avatarUrl: userData.avatarUrl || null,
        },
        assignedStudent_ids:
          userData.role === "teacher"
            ? userData.assignedStudent_ids
              ? userData.assignedStudent_ids.split(",").map((id) => id.trim())
              : []
            : [],
        familyStudent_ids:
          userData.role === "parent"
            ? userData.familyStudent_ids
              ? userData.familyStudent_ids.split(",").map((id) => id.trim())
              : []
            : [],
        registeredSubject_ids:
          userData.role === "student"
            ? userData.registeredSubject_ids
              ? userData.registeredSubject_ids.split(",").map((id) => id.trim())
              : []
            : [],
        assignedSubject_ids:
          userData.role === "teacher"
            ? userData.assignedSubject_ids
              ? userData.assignedSubject_ids.split(",").map((id) => id.trim())
              : []
            : [],
      });

      importedUsersDetails.push({ email: newUser.email, status: "success" });
    } catch (error) {
      console.error(`User '${userData.email || "null"}' Error:`, error.message);
      errors.push({ email: userData.email || "null", message: error.message });
    }
  }

  if (errors.length > 0) {
    res.status(207).json({
      message: `${importedUsersDetails.length} users are imported correctly, ${errors.length}  errors`,
      importedCount: importedUsersDetails.length,
      errors: errors,
      importedUsers: importedUsersDetails,
    });
  } else {
    res.status(200).json({
      message: `${importedUsersDetails.length} users are imported perfectly`,
      importedCount: importedUsersDetails.length,
      importedUsers: importedUsersDetails,
    });
  }
});
