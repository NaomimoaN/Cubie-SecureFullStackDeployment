import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      unique: true,
      // trim:true means it will remove any leading or trailing spaces from the string before saving it to the database
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    iconUrl: {
      type: String,
      required: false,
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    schedule: [
      {
        dayOfWeek: {
          type: String,
          required: true,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        },
        startTime: {
          type: String,
          required: true,
          match: /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        endTime: {
          type: String,
          required: true,
          match: /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// This line create a mongoose model. A model is a wrapper for MongoDB collection that provides an interface to interact with the database.
// The first argument is the name of the model, which is used to create the collection in the database. By default, Mongoose will create a collection with the pluralized and lowercase version of the model name (e.g., "subjects" for "Subject").
// Model also contains the methods to interact with mongoDB, such as find, create, updateOne, deleteOne, etc.
const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;
