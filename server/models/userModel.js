// server/models/userModel.js

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      // minlength:[8, 'Password must be at least 8 characters']
    },
    role: {
      type: String,
      required: true,
      default: "",
      enum: ["admin", "teacher", "student", "parent"],
    },
    profile: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      grade: {
        type: Number, //0709 Changed from String, because it is "Int" on mongoDB
        enum: ["K", "1", "2", "3", "4", "5", "6", "7"],
      },
      // Division/Class information for teachers and students
      division: {
        type: Number,
        required: false,
      },
      // Student ID for students
      studentId: {
        type: String,
        required: false,
      },
      // student -> parent
      parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      // student -> teacher
      teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      profilePictureUrl: {
        type: String,
        required: false,
        trim: true,
      },
      profilePictureKey: {
        type: String,
        required: false,
        trim: true,
      },
      avatarUrl: {
        type: String,
        required: false,
        trim: true,
      },
    },
    // teacher -> students
    assignedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // parent -> students
    familyStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    registeredSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    assignedSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    notificationSettings: {
      systemUpdate: { type: Boolean, default: false },
      schoolUpdate: { type: Boolean, default: true },
      gradeUpdate: { type: Boolean, default: false },
      calendar: { type: Boolean, default: true },
      groupChat: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  console.log("Pre-save hook triggered for user:", this.email);
  if (!this.isModified("password")) {
    console.log("Password not modified, skipping hashing for:", this.email);
    next();
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  console.log("Password hashed successfully for user:", this.email);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
