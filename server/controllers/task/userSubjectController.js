// server/controllers/task/userSubjectController.js

import asyncHandler from "express-async-handler";
import User from "../../models/userModel.js";

const getTeacherSubjects = asyncHandler(async (req, res) => {
  const teacherId = req.user.id;

  const teacher = await User.findById(teacherId)
    .populate("assignedSubjects")
    .select("assignedSubjects");

  if (!teacher) {
    res.status(404);
    throw new Error("Teacher not found or no assigned subjects.");
  }

  res.status(200).json(teacher.assignedSubjects);
});

const getStudentSubjects = asyncHandler(async (req, res) => {
  const studentId = req.user.id;

  const student = await User.findById(studentId)
    .populate("registeredSubjects")
    .select("registeredSubjects");

  if (!student) {
    res.status(404);
    throw new Error("Student not found or no registered subjects.");
  }
  if (!student.registeredSubjects || student.registeredSubjects.length === 0) {
    return res.status(200).json([]);
  }

  res.status(200).json(student.registeredSubjects);
});

const getStudentSubjectsById = asyncHandler(async (req, res) => {
  const studentIdToFetch = req.params.userId;

  if (!studentIdToFetch) {
    res.status(400);
    throw new Error("Student ID is required.");
  }

  if (req.user.role === "parent") {
    if (
      !req.user ||
      !req.user.familyStudents ||
      !Array.isArray(req.user.familyStudents)
    ) {
      res.status(403);
      throw new Error(
        "Parent user data is incomplete or children list is missing."
      );
    }

    const isChildOfParent = req.user.familyStudents.some((child) => {
      if (child && child._id) {
        return child._id.toString() === studentIdToFetch;
      }
      return false;
    });
    if (!isChildOfParent) {
      res.status(403);
      throw new Error("Not authorized to view this student's subjects.");
    }
  }

  const student = await User.findById(studentIdToFetch)
    .populate("registeredSubjects")
    .select("registeredSubjects");

  if (!student) {
    res.status(404);
    throw new Error(
      `Student with ID ${studentIdToFetch} not found or no registered subjects.`
    );
  }
  if (!student.registeredSubjects || student.registeredSubjects.length === 0) {
    return res.status(200).json([]);
  }

  res.status(200).json(student.registeredSubjects);
});

export { getTeacherSubjects, getStudentSubjects, getStudentSubjectsById };
