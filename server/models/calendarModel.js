import mongoose from "mongoose";

const calendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: ["homework", "exam", "event", "announcement", "meeting", "other"],
      default: "other",
    },
    repeat: {
      type: String,
      enum: ["none", "daily", "weekly", "monthly", "yearly"],
      default: "none",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
    targetAudience: {
      type: String,
      enum: ["all", "teachers", "parents", "students"],
      default: "all",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    hiddenForParents: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// インデックスの作成
calendarEventSchema.index({ start: 1, end: 1 });
calendarEventSchema.index({ category: 1 });
calendarEventSchema.index({ createdBy: 1 });
calendarEventSchema.index({ isActive: 1 });

// 仮想フィールド: イベントの期間（分）
calendarEventSchema.virtual("duration").get(function () {
  return Math.round((this.end - this.start) / (1000 * 60));
});

// 仮想フィールド: イベントの期間（時間）
calendarEventSchema.virtual("durationHours").get(function () {
  return Math.round(((this.end - this.start) / (1000 * 60 * 60)) * 100) / 100;
});

// メソッド: イベントが指定された日付範囲内にあるかチェック
calendarEventSchema.methods.isInDateRange = function (startDate, endDate) {
  return this.start >= startDate && this.end <= endDate;
};

// メソッド: イベントが指定された日付と重複するかチェック
calendarEventSchema.methods.overlapsWith = function (startDate, endDate) {
  return this.start < endDate && this.end > startDate;
};

// スタティックメソッド: 日付範囲内のイベントを取得
calendarEventSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    start: { $lt: endDate },
    end: { $gt: startDate },
    isActive: true,
  })
    .populate("createdBy", "name email")
    .populate("subject", "name");
};

// スタティックメソッド: カテゴリ別のイベントを取得
calendarEventSchema.statics.findByCategory = function (category) {
  return this.find({
    category,
    isActive: true,
  })
    .populate("createdBy", "name email")
    .populate("subject", "name");
};

// スタティックメソッド: アクティブなイベントのみを取得
calendarEventSchema.statics.findActive = function () {
  return this.find({ isActive: true })
    .populate("createdBy", "name email")
    .populate("subject", "name")
    .sort({ start: 1 });
};

const CalendarEvent = mongoose.model("CalendarEvent", calendarEventSchema);

export default CalendarEvent;
