/**
 * @purpose 出欠データのためのMongooseモデル
 */

import mongoose from "mongoose";

const attendanceSchema = mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "early_leave"],
      required: true,
    },
    schoolYear: {
      type: String,
      required: false,
      default: "2024-2025",
    },
    week: {
      type: Number,
      required: false,
    },
    notes: {
      type: String,
      default: "",
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // 自動システムで記録される場合もあるため
    },
  },
  {
    timestamps: true,
  }
);

// 同じ生徒の同じ日の重複記録を防ぐためのインデックス
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema, "attendance");

export default Attendance;
