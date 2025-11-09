import mongoose from "mongoose";

const submittedFileSchema = mongoose.Schema(
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
  },
  { _id: false }
);

const submissionSchema = mongoose.Schema(
  {
    homework: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Homework",
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    submittedFiles: [submittedFileSchema],
    submittedAt: {
      type: Date,
      default: null,
    },
    // Added based on Database
    submissionStatus: {
      type: String,
      enum: ["assigned", "submitted", "graded"],
      default: "assigned",
    },
    grade: {
      score: {
        type: Number,
        default: null,
      },
      letterGrade: {
        type: String,
        trim: true,
      },
      rubricScores: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
        // 0727
        // communication: {
        //   type: Number,
        //   default: null,
        // },
        // creativeThinking: {
        //   type: Number,
        //   default: null,
        // },
        // criticalThinking: {
        //   type: Number,
        //   default: null,
        // },
        // identity: {
        //   type: Number,
        //   default: null,
        // },
        // responsibility: {
        //   type: Number,
        //   default: null,
        // },
        // socialResponsibility: {
        //   type: Number,
        //   default: null,
        // },
      },
      feedback: {
        type: String,
        trim: true,
      },
      gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      gradedAt: {
        type: Date,
        default: null,
      },
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    annotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Annotation",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ homework: 1, student: 1 }, { unique: true });

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;
