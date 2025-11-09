import mongoose from "mongoose";

const weekSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    weekNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    term: {
      type: Number,
      required: true,
      min: 1,
    },
    weekNumOfTerm: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    contents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Content",
      },
    ],
    homeworks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Homework",
      },
    ],
  },
  {
    timestamps: true,
  }
);

weekSchema.index({ subject: 1, weekNumber: 1 }, { unique: true });

const Week = mongoose.model("Week", weekSchema);

export default Week;
