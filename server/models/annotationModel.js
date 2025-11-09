// server/models/annotationModel.js
import mongoose from "mongoose";

const annotationSchema = new mongoose.Schema(
  {
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["student", "teacher"],
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: [],
    },
    isFinal: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

annotationSchema.index({ submission: 1, owner: 1, type: 1 });

const Annotation = mongoose.model("Annotation", annotationSchema);

export default Annotation;
