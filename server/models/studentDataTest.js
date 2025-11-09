import mongoose from "mongoose";

const StudentDataTestSchema = new mongoose.Schema(
  {
    "Student Name": { type: String, required: true },
    Grade: { type: Number, required: true },
    Class: { type: String, required: true },
    "Homeroom Teacher_u_id": { type: String, required: true },
    Japanese: { type: Number, required: true },
    Math: { type: Number, required: true },
    Science: { type: Number, required: true },
    "Social Studies": { type: Number, required: true },
    English: { type: Number, required: true },
  },
  // You can change the collection name here if needed
  { collection: "test-teacher1" }
);

const StudentDataTest = mongoose.model(
  "StudentDataTest",
  StudentDataTestSchema
);

export default StudentDataTest;
