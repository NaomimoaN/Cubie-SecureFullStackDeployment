import mongoose from "mongoose";

const announcementSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    creation_date: {
      type: Date,
      default: Date.now,
    },
    recipient_group: {
      type: String,
      enum: ["All", "Parents", "Students"],
      required: true,
    },
    creatorTitle: {
      type: String,
      required: false,
      default: null,
    },
    description: {
      type: String,
      required: true,
      default: "",
    },
    fileKey: { type: String, required: false },
    fileUrl: {
      type: String,
      required: false,
      default: null,
    },
    number_date: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: false,
  }
);

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;