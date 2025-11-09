import mongoose from "mongoose";

const academicWeekSchema = new mongoose.Schema(
  {
    week: {
      type: Number,
      required: true,
      min: 1,
      max: 52, // 年間最大52週
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    schoolYear: {
      type: String,
      required: true,
      default: "2024-2025",
    },
    term: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
      default: 1,
    },
    description: {
      type: String,
      default: "",
    },
    isCurrent: {
      type: Boolean,
      default: false, // 一度に一つの週のみがtrueになる
    },
    isSchoolBreak: {
      type: Boolean,
      default: false, // 通常授業期間はfalse
    },
    breakType: {
      type: String,
      enum: ["summer", "winter", "spring", "fall", "other"],
      required: false, // isSchoolBreakがtrueの場合のみ必要
    },
    breakDescription: {
      type: String,
      required: false, // 休み期間の説明（例: "夏休み", "冬休み"）
    },
  },
  {
    timestamps: true,
  }
);

// 同一年度内でweekは一意
academicWeekSchema.index({ schoolYear: 1, week: 1 }, { unique: true });

// 日付範囲の重複チェック用インデックス
academicWeekSchema.index({ schoolYear: 1, startDate: 1, endDate: 1 });

// 日付が期間内にあるかチェックするスタティックメソッド
academicWeekSchema.statics.findWeekByDate = async function (
  date,
  schoolYear = "2024-2025"
) {
  const targetDate = new Date(date);

  // 時間部分を除去して日付のみで比較
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  return await this.findOne({
    schoolYear: schoolYear,
    startDate: { $lte: endOfDay },
    endDate: { $gte: startOfDay },
  });
};

// バリデーション: endDateはstartDateより後でなければならない
academicWeekSchema.pre("save", function (next) {
  if (this.endDate <= this.startDate) {
    next(new Error("End date must be after start date"));
  } else {
    next();
  }
});

// 現在の週を取得するスタティックメソッド
academicWeekSchema.statics.getCurrentWeek = async function (
  schoolYear = "2024-2025"
) {
  const today = new Date();
  return await this.findWeekByDate(today, schoolYear);
};

// 休み期間かどうかを判定するスタティックメソッド
academicWeekSchema.statics.isCurrentlySchoolBreak = async function (
  schoolYear = "2024-2025"
) {
  const currentWeek = await this.getCurrentWeek(schoolYear);
  return currentWeek ? currentWeek.isSchoolBreak : false;
};

// 最新の授業週を取得（休み期間でない週）
academicWeekSchema.statics.getLatestSchoolWeek = async function (
  schoolYear = "2024-2025"
) {
  const today = new Date();
  return await this.findOne({
    schoolYear: schoolYear,
    isSchoolBreak: false,
    endDate: { $lte: today },
  })
    .sort({ week: -1 })
    .limit(1);
};

// 現在の週を設定するスタティックメソッド（一度に一つの週のみcurrent）
academicWeekSchema.statics.setCurrentWeek = async function (
  week,
  schoolYear = "2024-2025"
) {
  // 既存の現在週をfalseに設定
  await this.updateMany(
    { schoolYear: schoolYear },
    { $set: { isCurrent: false } }
  );

  // 指定された週をcurrentに設定
  const result = await this.updateOne(
    { schoolYear: schoolYear, week: week },
    { $set: { isCurrent: true } }
  );

  return result;
};

// 現在設定されている週を取得するスタティックメソッド
academicWeekSchema.statics.getCurrentSetWeek = async function (
  schoolYear = "2024-2025"
) {
  return await this.findOne({
    schoolYear: schoolYear,
    isCurrent: true,
  });
};

// 現在の週を取得（日付ベースまたは手動設定ベース）
academicWeekSchema.statics.getCurrentWeekSmart = async function (
  schoolYear = "2024-2025"
) {
  // まず手動設定された現在週をチェック
  const manualCurrent = await this.getCurrentSetWeek(schoolYear);
  if (manualCurrent) {
    return manualCurrent;
  }

  // 手動設定がない場合は日付ベースで判定
  return await this.getCurrentWeek(schoolYear);
};

const AcademicWeek = mongoose.model(
  "AcademicWeek",
  academicWeekSchema,
  "academic_weeks"
);

export default AcademicWeek;
