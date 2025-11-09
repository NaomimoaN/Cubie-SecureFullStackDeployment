import mongoose from "mongoose";

// One student has one collection
const aiQuestionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    aiQuestions: {
      subjects: {
        type: mongoose.Schema.Types.ObjectId,
        // The "Subject name is required" is the error message that will be returned if the subject field is not provided when creating a new document.
        ref: "Subject", // This field references the Subject model, allowing us to link questions to a specific subject.
        // trim:true means it will remove any leading or trailing spaces from the string before saving it to the database
        weekNumbers: {
          type: Number,
          required: true,
          // 10 questions per week, 4 answer choices per question, 1 correct answer per question
          questionAndAnswers: [
            {
              question: {
                type: String,
                required: true,
              },
              options: [{
                type: String,
                required: true,
              }
              ],
              correctAnswer: {
                type: String,
                required: true,
              },
              rightOrWrong: {
                type: Boolean,
                default: false,
              },
              createdAt: {
                type: Date,
                default: Date.now,
              },
            },
          ],
        }
      },
    },
  },
  {
    // timestamps: true will automatically add createdAt and updatedAt fields to the schema
    timestamps: true,
  }
);

// This line create a mongoose model. A model is a wrapper for MongoDB collection that provides an interface to interact with the database.
// The first argument is the name of the model, which is used to create the collection in the database. By default, Mongoose will create a collection with the pluralized and lowercase version of the model name (e.g., "subjects" for "Subject").
// Model also contains the methods to interact with mongoDB, such as find, create, updateOne, deleteOne, etc.
const aiQuestion = mongoose.model("aiQuestion", aiQuestionSchema);

export default aiQuestion;
