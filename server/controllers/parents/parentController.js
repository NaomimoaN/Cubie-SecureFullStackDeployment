/**
 * @purpose 親ユーザー専用の機能を管理します。
 * ログインした親がfamilyStudents配列に登録された学生の情報にアクセスし、
 * 学生の成績、出席状況、課題提出状況などを確認できる機能を提供します。
 */

import asyncHandler from "express-async-handler";
import User from "../../models/userModel.js";
import mongoose from "mongoose";

/**
 * @desc 親の家族学生一覧を取得
 * @route GET /api/parents/family-students
 * @access Private (Parent only)
 */
const getFamilyStudents = asyncHandler(async (req, res) => {
  try {
    // ログインした親ユーザーの情報を取得
    const parent = await User.findById(req.user._id).populate({
      path: "familyStudents",
      select: "-password",
      populate: [
        {
          path: "profile.teacher",
          select: "profile.firstName profile.lastName email",
        },
        {
          path: "registeredSubjects",
          select: "name description",
        },
      ],
    });

    if (!parent) {
      res.status(404);
      throw new Error("親ユーザーが見つかりません");
    }

    // 親のロールをチェック
    if (parent.role !== "parent") {
      res.status(403);
      throw new Error("この機能は親ユーザーのみアクセス可能です");
    }

    res.status(200).json({
      success: true,
      data: {
        parentInfo: {
          id: parent._id,
          name: `${parent.profile?.firstName || ""} ${
            parent.profile?.lastName || ""
          }`.trim(),
          email: parent.email,
        },
        familyStudents: parent.familyStudents || [],
      },
    });
  } catch (error) {
    res.status(500);
    throw new Error(`家族学生一覧の取得に失敗しました: ${error.message}`);
  }
});

/**
 * @desc 特定の家族学生の詳細情報を取得
 * @route GET /api/parents/family-students/:studentId
 * @access Private (Parent only)
 */
const getFamilyStudentById = asyncHandler(async (req, res) => {
  try {
    const { studentId } = req.params;

    // パラメータの検証
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400);
      throw new Error("無効な学生IDです");
    }

    // 親ユーザーの情報を取得
    const parent = await User.findById(req.user._id);

    if (!parent || parent.role !== "parent") {
      res.status(403);
      throw new Error("この機能は親ユーザーのみアクセス可能です");
    }

    // 指定された学生が親のfamilyStudents配列に含まれているかチェック
    const isFamily = parent.familyStudents.some(
      (id) => id.toString() === studentId
    );

    if (!isFamily) {
      res.status(403);
      throw new Error("指定された学生へのアクセス権限がありません");
    }

    // 学生の詳細情報を取得
    const student = await User.findById(studentId)
      .select("-password")
      .populate([
        {
          path: "profile.teacher",
          select: "profile.firstName profile.lastName email profile.subject",
        },
        {
          path: "registeredSubjects",
          select: "name description",
        },
      ]);

    if (!student) {
      res.status(404);
      throw new Error("学生が見つかりません");
    }

    res.status(200).json({
      success: true,
      data: {
        student: student,
      },
    });
  } catch (error) {
    res.status(500);
    throw new Error(`学生情報の取得に失敗しました: ${error.message}`);
  }
});

/**
 * @desc 家族学生の進捗状況（成績・出席）を取得
 * @route GET /api/parents/family-students/:studentId/progress
 * @access Private (Parent only)
 */
const getFamilyStudentProgress = asyncHandler(async (req, res) => {
  try {
    const { studentId } = req.params;

    // パラメータの検証
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      res.status(400);
      throw new Error("無効な学生IDです");
    }

    // 親ユーザーの情報を取得
    const parent = await User.findById(req.user._id);

    if (!parent || parent.role !== "parent") {
      res.status(403);
      throw new Error("この機能は親ユーザーのみアクセス可能です");
    }

    // アクセス権限チェック
    const isFamily = parent.familyStudents.some(
      (id) => id.toString() === studentId
    );

    if (!isFamily) {
      res.status(403);
      throw new Error("指定された学生へのアクセス権限がありません");
    }

    // 学生の基本情報を取得
    const student = await User.findById(studentId)
      .select("profile email")
      .populate("registeredSubjects", "name");

    if (!student) {
      res.status(404);
      throw new Error("学生が見つかりません");
    }

    // TODO: 以下は他のサービス/コントローラーと連携して実装
    // - 出席データの取得（attendanceService）
    // - 成績データの取得（gradeService）
    // - 課題提出状況の取得（submissionService）

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: `${student.profile?.firstName || ""} ${
            student.profile?.lastName || ""
          }`.trim(),
          email: student.email,
          grade: student.profile?.grade,
          division: student.profile?.division,
          subjects: student.registeredSubjects,
        },
        // 実装予定の進捗データ
        progress: {
          attendance: "実装予定",
          grades: "実装予定",
          submissions: "実装予定",
        },
      },
    });
  } catch (error) {
    res.status(500);
    throw new Error(`学生進捗情報の取得に失敗しました: ${error.message}`);
  }
});

/**
 * @desc 親ユーザーが自分の情報を更新
 * @route PUT /api/parents/profile
 * @access Private (Parent only)
 */
const updateParentProfile = asyncHandler(async (req, res) => {
  try {
    const { firstName, lastName, profilePictureUrl } = req.body;

    const parent = await User.findById(req.user._id);

    if (!parent || parent.role !== "parent") {
      res.status(403);
      throw new Error("この機能は親ユーザーのみアクセス可能です");
    }

    // プロフィール情報を更新
    if (firstName) parent.profile.firstName = firstName;
    if (lastName) parent.profile.lastName = lastName;
    if (profilePictureUrl) parent.profile.profilePictureUrl = profilePictureUrl;

    const updatedParent = await parent.save();

    res.status(200).json({
      success: true,
      message: "プロフィールが正常に更新されました",
      data: {
        id: updatedParent._id,
        email: updatedParent.email,
        profile: updatedParent.profile,
      },
    });
  } catch (error) {
    res.status(500);
    throw new Error(`プロフィール更新に失敗しました: ${error.message}`);
  }
});

export {
  getFamilyStudents,
  getFamilyStudentById,
  getFamilyStudentProgress,
  updateParentProfile,
};
