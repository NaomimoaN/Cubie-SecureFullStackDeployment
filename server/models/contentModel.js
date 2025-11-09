// server/models/contentModel.js

import mongoose from "mongoose";

const contentFileSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      trim: true,
      required: true,
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
      unique: true,
      trim: true,
      sparse: true,
      required: true,
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

const contentSchema = mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    week: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Week",
      required: true,
    },
    contents: {
      type: [contentFileSchema],
      default: [],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please add a teacher ID"],
      ref: "User",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

contentSchema.index({ week: 1, subject: 1 });
contentSchema.index({ uploadedBy: 1 });

const Content = mongoose.model("Content", contentSchema);

export default Content;
