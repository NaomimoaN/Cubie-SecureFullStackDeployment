// server/controllers/task/manageWeekController.js
/**
 * @purpose Handles API requests for updating academic weeks.
 * It validates week IDs, enforces role-based permissions (teacher/admin),
 * and updates week titles and descriptions in the database.
 */

import Week from "../../models/weekModel.js";
import User from "../../models/userModel.js";
import AcademicWeek from "../../models/AcademicWeek.js";
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";

const updateWeek = asyncHandler(async (req, res) => {
  const { id: weekId } = req.params;
  const { title, description } = req.body;

  if (!mongoose.Types.ObjectId.isValid(weekId)) {
    res.status(400);
    throw new Error("Invalid Week ID format.");
  }

  const week = await Week.findById(weekId);

  if (!week) {
    res.status(404);
    throw new Error("Week not found.");
  }

  const user = req.user;

  if (user.role === "teacher") {
    const isAssignedToSubject = user.assignedSubjects.some(
      (assignedSub) => assignedSub._id.toString() === week.subject.toString()
    );

    if (!isAssignedToSubject) {
      res.status(403);
      throw new Error(
        "Forbidden: You do not have permission to update this week (not assigned to subject)."
      );
    }
  } else if (user.role !== "admin") {
    res.status(403);
    throw new Error(
      "Forbidden: Your role does not have permission to update weeks."
    );
  }

  week.title = title !== undefined ? title : week.title;
  week.description = description !== undefined ? description : week.description;

  const updatedWeek = await week.save();

  res.status(200).json({
    message: "Week updated successfully",
    week: {
      _id: updatedWeek._id,
      week: updatedWeek.week,
      title: updatedWeek.title,
      description: updatedWeek.description,
      subject: updatedWeek.subject,
    },
  });
});

// 現在の週を取得
const getCurrentWeek = asyncHandler(async (req, res) => {
  try {
    const currentWeek = await AcademicWeek.getCurrentWeekSmart();

    if (!currentWeek) {
      res.status(404);
      throw new Error("現在の週が見つかりません");
    }

    res.status(200).json({
      success: true,
      message: "現在の週を取得しました",
      data: {
        week: currentWeek.week,
        startDate: currentWeek.startDate,
        endDate: currentWeek.endDate,
        schoolYear: currentWeek.schoolYear,
        isSchoolBreak: currentWeek.isSchoolBreak,
        breakType: currentWeek.breakType,
        breakDescription: currentWeek.breakDescription,
        isCurrent: currentWeek.isCurrent,
      },
    });
  } catch (error) {
    res.status(500);
    throw new Error(`現在の週の取得に失敗しました: ${error.message}`);
  }
});

// 現在の週を手動設定（管理者のみ）
const setCurrentWeek = asyncHandler(async (req, res) => {
  const { week, schoolYear = "2024-2025" } = req.body;

  // 管理者権限チェック
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("管理者のみがこの操作を実行できます");
  }

  if (!week) {
    res.status(400);
    throw new Error("週番号は必須です");
  }

  try {
    // 週が存在するかチェック
    const weekDoc = await AcademicWeek.findOne({
      week: week,
      schoolYear: schoolYear,
    });

    if (!weekDoc) {
      res.status(404);
      throw new Error("指定された週が見つかりません");
    }

    // 現在の週を設定
    await AcademicWeek.setCurrentWeek(week, schoolYear);

    res.status(200).json({
      success: true,
      message: `Week ${week} を現在の週として設定しました`,
      data: {
        week: weekDoc.week,
        schoolYear: weekDoc.schoolYear,
        startDate: weekDoc.startDate,
        endDate: weekDoc.endDate,
      },
    });
  } catch (error) {
    res.status(500);
    throw new Error(`現在の週の設定に失敗しました: ${error.message}`);
  }
});

export { updateWeek, getCurrentWeek, setCurrentWeek };
