import mongoose from "mongoose";

const homeworkFileSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      trim: true,
    },
    fileURL: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
    },
    s3Key: {
      type: String,
      required: true,
      unique: false,
      trim: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    fileType: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const homeworkSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    week: {
      type: Number,
      required: true,
      min: 1,
      max: 40,
    },
    weekObjectId: {
      //Instead of week, we use weekObjectId to reference the Week model
      type: mongoose.Schema.Types.ObjectId,
      ref: "Week",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    assignedDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true, // フロントエンドで必須のためスキーマも必須に
    },
    maxPoints: {
      type: Number,
      default: 100, // DB例に合わせ、デフォルト値を設定
    },
    homeworkNumber: {
      type: Number,
    },
    chapterNumber: {
      // DB例の "5.1" (String) に合わせます。
      type: String,
      trim: true,
    },
    page: {
      type: String,
      trim: true,
    },
    chapterTitle: {
      type: String,
      trim: true,
    },
    term: {
      type: Number,
      trim: true,
    },

    files: [homeworkFileSchema],

    rubricEmerging: {
      type: String,
      trim: true,
      default: "",
    },
    rubricDeveloping: {
      type: String,
      trim: true,
      default: "",
    },
    rubricProficient: {
      type: String,
      trim: true,
      default: "",
    },
    rubricExtending: {
      type: String,
      trim: true,
      default: "",
    },

    coreCompetencies: {
      type: [String],
      default: [],
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Submission",
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Homework) {
  mongoose.deleteModel("Homework");
}

const Homework = mongoose.model("Homework", homeworkSchema);

export default Homework;
