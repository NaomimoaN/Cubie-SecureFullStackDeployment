// server/controllers/model/homeworkController.js

import asyncHandler from "express-async-handler";
import Homework from "../../models/homeworkModel.js";
import Week from "../../models/weekModel.js";
import Subject from "../../models/subjectModel.js";
import Submission from "../../models/submissionModel.js";
import User from "../../models/userModel.js";
import {
  uploadFile,
  deleteFile,
  generateSignedUrlForPdf, //not used for now
  generateDownloadSignedUrl,
} from "../../services/s3Service.js";
import mongoose from "mongoose";
import { sendHomeworkNotification } from "../../utils/notificationHelper.js";
import crypto from "crypto";

const rollbackS3Uploads = async (s3Keys) => {
  if (s3Keys && s3Keys.length > 0) {
    for (const key of s3Keys) {
      try {
        await deleteFile(key);
      } catch (rollbackError) {
        console.error(`Failed to rollback S3 file ${key}:`, rollbackError);
      }
    }
  }
};

const createHomework = asyncHandler(async (req, res) => {
  if (!req.user || (req.user.role !== "teacher" && req.user.role !== "admin")) {
    res.status(403);
    throw new Error("Forbidden: Only teachers and admins can create homework.");
  }

  const {
    title,
    description,
    dueDate,
    week: selectedWeekId,
    rubricEmerging,
    rubricDeveloping,
    rubricProficient,
    rubricExtending,
    coreCompetencies: coreCompetenciesJson,
    subject: subjectId,
    status,
  } = req.body;

  const uploadedBy = req.user._id;
  const uploadedFiles = req.files;

  if (!title || !dueDate || !selectedWeekId || !subjectId || !status) {
    res.status(400);
    throw new Error("Title, Due Date, Week, Subject, and Status are required.");
  }

  if (
    !mongoose.Types.ObjectId.isValid(subjectId) ||
    !mongoose.Types.ObjectId.isValid(selectedWeekId)
  ) {
    res.status(400);
    throw new Error("Invalid Subject ID or Week ID format.");
  }

  if (!uploadedFiles || uploadedFiles.length === 0) {
    res.status(400);
    throw new Error("At least one file is required for homework creation.");
  }

  let parsedCoreCompetencies = [];
  if (coreCompetenciesJson) {
    try {
      parsedCoreCompetencies = JSON.parse(coreCompetenciesJson);
      if (!Array.isArray(parsedCoreCompetencies)) {
        throw new Error("Core competencies must be an array.");
      }
    } catch (e) {
      res.status(400);
      throw new Error("Invalid format for coreCompetencies.");
    }
  }

  let homeworkFilesMetadata = [];
  let uploadedS3Keys = [];

  try {
    const weekDoc = await Week.findById(selectedWeekId);
    if (!weekDoc) {
      res.status(400);
      throw new Error("Selected week not found.");
    }
    const actualWeekNumber = weekDoc.weekNumber;

    const subjectDoc = await Subject.findById(subjectId).populate(
      "students",
      "_id"
    );
    if (!subjectDoc) {
      res.status(400);
      throw new Error("Selected subject not found.");
    }

    for (const file of uploadedFiles) {
      const fileName = file.originalname;
      const fileType = file.mimetype;
      const s3Key = `homeworks/${subjectId}/${selectedWeekId}/${Date.now()}_${fileName.replace(
        /\s/g,
        "_"
      )}`;

      await uploadFile(file.buffer, s3Key, fileType);
      uploadedS3Keys.push(s3Key);

      const fileURL = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${s3Key}`;
      homeworkFilesMetadata.push({
        fileName: fileName,
        s3Key: s3Key,
        fileType: fileType,
        fileURL: fileURL,
        size: file.size,
      });
    }

    const newHomework = await Homework.create({
      title,
      description,
      dueDate: new Date(dueDate),
      subject: new mongoose.Types.ObjectId(subjectId),
      week: actualWeekNumber,
      weekObjectId: new mongoose.Types.ObjectId(selectedWeekId),
      uploadedBy: new mongoose.Types.ObjectId(uploadedBy),
      submissions: [],
      files: homeworkFilesMetadata,
      rubricEmerging,
      rubricDeveloping,
      rubricProficient,
      rubricExtending,
      coreCompetencies: parsedCoreCompetencies,
      status,
    });

    if (newHomework) {
      await Week.findByIdAndUpdate(
        weekDoc._id,
        { $push: { homeworks: newHomework._id } },
        { new: true, runValidators: true }
      );
      await Subject.findByIdAndUpdate(
        subjectId,
        { $push: { homeworks: newHomework._id } },
        { new: true, runValidators: true }
      );

      const studentIds = subjectDoc.students.map((student) => student._id);
      const submissionsToCreate = studentIds.map((studentId) => ({
        homework: newHomework._id,
        student: studentId,
        submissionStatus: "assigned",
      }));

      let createdSubmissions = [];
      if (submissionsToCreate.length > 0) {
        try {
          createdSubmissions = await Submission.insertMany(
            submissionsToCreate,
            { ordered: false }
          );
        } catch (err) {
          if (err.writeErrors) {
            err.writeErrors.forEach((error) => {
              if (error.err.code !== 11000) {
                console.error("Error creating submission entry:", error.err);
              }
            });
          } else {
            console.error("Error inserting submissions:", err);
          }
          if (!createdSubmissions.length && err.insertedDocs) {
            createdSubmissions = err.insertedDocs;
          }
        }
      }

      if (createdSubmissions.length > 0) {
        const submissionIds = createdSubmissions.map((sub) => sub._id);
        await Homework.findByIdAndUpdate(
          newHomework._id,
          { $push: { submissions: { $each: submissionIds } } },
          { new: true, runValidators: true }
        );
      }
    } else {
      res.status(500);
      throw new Error("Failed to create homework document unexpectedly.");
    }

    try {
      await sendHomeworkNotification(
        {
          _id: newHomework._id,
          title: newHomework.title,
          dueDate: newHomework.dueDate,
          subject: newHomework.subject,
          subjectName: subjectDoc.name,
          week: newHomework.week,
        },
        "created"
      );
    } catch (notificationError) {
      console.error("Failed to send homework notification:", notificationError);
    }

    res.status(201).json({
      message: "Homework created successfully!",
      homework: newHomework,
    });
  } catch (createError) {
    await rollbackS3Uploads(uploadedS3Keys);

    if (
      createError instanceof Error &&
      createError.name === "ValidationError"
    ) {
      const messages = Object.values(createError.errors).map(
        (val) => val.message
      );
      res.status(400);
      throw new Error(`Validation Error: ${messages.join(", ")}`);
    }

    if (!res.headersSent) {
      res.status(createError.statusCode || 500);
    }
    throw new Error(
      createError.message ||
        "Failed to create new homework document. Please try again."
    );
  }
});

const getHomeworkById = asyncHandler(async (req, res) => {
  const homework = req.homework;

  if (!homework) {
    res.status(404);
    throw new Error("Homework not found.");
  }

  const populatedHomework = await Homework.findById(homework._id)
    .populate("subject", "name _id")
    .populate("uploadedBy", "profile.firstName profile.lastName")
    .populate({
      path: "submissions",
      populate: [
        { path: "student", select: "profile.firstName profile.lastName" },
        {
          path: "grade.gradedBy",
          select: "profile.firstName profile.lastName",
        },
      ],
    });

  if (!populatedHomework) {
    res.status(404);
    throw new Error("Homework not found after re-population.");
  }

  res.status(200).json(populatedHomework);
});

const updateHomework = asyncHandler(async (req, res) => {
  const homework = req.homework;
  if (!homework) {
    res.status(404);
    throw new Error("Homework not found or you do not have access.");
  }

  const {
    title,
    description,
    dueDate,
    rubricEmerging,
    rubricDeveloping,
    rubricProficient,
    rubricExtending,
    coreCompetencies: coreCompetenciesJson,
    status,
    s3KeysToDelete,
  } = req.body;

  const uploadedFiles = req.files;

  if (!title || !description || !dueDate || !status) {
    res.status(400);
    throw new Error(
      "Missing required fields for update: title, description, dueDate, status."
    );
  }

  let parsedCoreCompetencies = [];
  if (coreCompetenciesJson) {
    try {
      parsedCoreCompetencies = JSON.parse(coreCompetenciesJson);
      if (!Array.isArray(parsedCoreCompetencies)) {
        throw new Error("Core competencies must be an array for update.");
      }
    } catch (e) {
      res.status(400);
      throw new Error("Invalid format for coreCompetencies for update.");
    }
  }

  let currentFiles = homework.files || [];
  let newlyUploadedKeys = [];

  if (s3KeysToDelete && s3KeysToDelete.length > 0) {
    for (const s3Key of s3KeysToDelete) {
      const initialLength = currentFiles.length;
      currentFiles = currentFiles.filter((file) => file.s3Key !== s3Key);
      if (currentFiles.length < initialLength) {
        try {
          await deleteFile(s3Key);
        } catch (s3DeleteError) {
          console.error(
            `Error deleting S3 file ${s3Key} during homework update:`,
            s3DeleteError
          );
        }
      }
    }
  }

  if (uploadedFiles && uploadedFiles.length > 0) {
    const subjectIdString = homework.subject.toString();
    const weekObjectIdString = homework.weekObjectId.toString();

    for (const file of uploadedFiles) {
      const fileName = file.originalname;
      const fileType = file.mimetype;
      const fileExtension = fileName.split(".").pop();

      const s3Key = `homeworks/${subjectIdString}/${weekObjectIdString}/${crypto.randomUUID()}.${fileExtension}`;

      try {
        await uploadFile(file.buffer, s3Key, fileType);
        newlyUploadedKeys.push(s3Key);

        const fileURL = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${s3Key}`;
        currentFiles.push({
          fileName: fileName,
          s3Key: s3Key,
          fileType: fileType,
          fileURL: fileURL,
          size: file.size,
        });
      } catch (s3UploadError) {
        console.error(
          `Error uploading new file ${fileName} during update:`,
          s3UploadError
        );

        await rollbackS3Uploads(newlyUploadedKeys);
        res.status(500);
        throw new Error(`Failed to upload new file to S3: ${fileName}`);
      }
    }
  }

  homework.title = title;
  homework.description = description;
  homework.dueDate = new Date(dueDate);
  homework.status = status;
  homework.rubricEmerging = rubricEmerging;
  homework.rubricDeveloping = rubricDeveloping;
  homework.rubricProficient = rubricProficient;
  homework.rubricExtending = rubricExtending;
  homework.coreCompetencies = parsedCoreCompetencies;
  homework.files = currentFiles;

  try {
    const updatedHomework = await homework.save();

    try {
      const populatedHomework = await Homework.findById(
        updatedHomework._id
      ).populate("subject", "name");
      await sendHomeworkNotification(
        {
          _id: updatedHomework._id,
          title: updatedHomework.title,
          dueDate: updatedHomework.dueDate,
          subject: updatedHomework.subject,
          subjectName: populatedHomework.subject.name,
          week: updatedHomework.week,
        },
        "updated"
      );
    } catch (notificationError) {
      console.error(
        "Failed to send homework update notification:",
        notificationError
      );
    }

    res.status(200).json({
      message: "Homework updated successfully.",
      homework: updatedHomework,
    });
  } catch (saveError) {
    await rollbackS3Uploads(newlyUploadedKeys);

    if (saveError.name === "ValidationError") {
      const messages = Object.values(saveError.errors).map(
        (val) => val.message
      );
      res.status(400);
      throw new Error(`Validation Error during save: ${messages.join(", ")}`);
    }
    if (!res.headersSent) {
      res.status(saveError.statusCode || 500);
    }
    throw new Error(
      "Failed to save homework document to DB. Please try again."
    );
  }
});

const deleteHomework = asyncHandler(async (req, res) => {
  const homework = req.homework;

  if (!homework) {
    res.status(404);
    throw new Error("Homework not found or you do not have access.");
  }

  const filesToDeleteFromS3 = [];

  if (homework.files && homework.files.length > 0) {
    homework.files.forEach((file) => filesToDeleteFromS3.push(file.s3Key));
  }

  const submissionsToDelete = await Submission.find({ homework: homework._id });
  for (const submission of submissionsToDelete) {
    if (submission.submittedFiles && submission.submittedFiles.length > 0) {
      submission.submittedFiles.forEach((file) =>
        filesToDeleteFromS3.push(file.s3Key)
      );
    }
    await Submission.findByIdAndDelete(submission._id);
  }

  const homeworkForNotification = {
    _id: homework._id,
    title: homework.title,
    subject: homework.subject,
    week: homework.week,
  };

  let subjectName = "Unknown Subject";
  try {
    const subjectDoc = await Subject.findById(homework.subject);
    if (subjectDoc) {
      subjectName = subjectDoc.name;
    }
  } catch (error) {
    console.error("Error fetching subject for notification:", error);
  }

  await rollbackS3Uploads(filesToDeleteFromS3);

  try {
    if (homework.weekObjectId) {
      await Week.findByIdAndUpdate(
        homework.weekObjectId,
        { $pull: { homeworks: homework._id } },
        { new: true, runValidators: true }
      );
    }

    await Subject.updateOne(
      { homeworks: homework._id },
      { $pull: { homeworks: homework._id } }
    );

    await Homework.findByIdAndDelete(homework._id);

    try {
      await sendHomeworkNotification(
        {
          _id: homeworkForNotification._id,
          title: homeworkForNotification.title,
          subject: homeworkForNotification.subject,
          subjectName: subjectName,
          week: homeworkForNotification.week,
        },
        "deleted"
      );
    } catch (notificationError) {
      console.error(
        "Failed to send homework deletion notification:",
        notificationError
      );
    }
  } catch (dbError) {
    console.error(`Error deleting homework document from DB:`, dbError);
    res.status(500);
    throw new Error(`Failed to delete homework document from DB.`);
  }

  res.status(200).json({
    message: "Homework and all associated files deleted successfully.",
    deletedHomeworkId: homework._id,
  });
});

const getSignedContentUploadUrl = asyncHandler(async (req, res) => {
  if (!req.user || (req.user.role !== "teacher" && req.user.role !== "admin")) {
    res.status(403);
    throw new Error("Forbidden: Only teachers and admins can get upload URLs.");
  }

  const { fileKey, contentType } = req.body;

  if (!fileKey || !contentType) {
    res.status(400);
    throw new Error("File key and content type are required.");
  }

  try {
    const signedUrl = await generateUploadSignedUrl(fileKey, contentType); //
    res.status(200).json({
      signedUrl,
      s3Key: fileKey,
      fileName: fileKey.split("/").pop(),
      fileType: contentType,
    });
  } catch (error) {
    res.status(error.statusCode || 500);
    throw new Error(`Failed to generate upload URL: ${error.message}`);
  }
});

const getSignedHomeworkDownloadUrl = asyncHandler(async (req, res) => {
  const homework = req.homework;
  if (!homework) {
    res.status(404);
    throw new Error("Homework not found or you do not have access.");
  }

  const { s3Key } = req.query;
  const decodedS3Key = s3Key;
  const fileToDownload = homework.files.find(
    (file) => file.s3Key === decodedS3Key
  );

  if (!fileToDownload) {
    res.status(404);
    throw new Error(
      `File with S3 key "${decodedS3Key}" not found within this homework's files. Ensure the S3 key is correct and the file exists.`
    );
  }

  try {
    const signedUrl = await generateDownloadSignedUrl(
      fileToDownload.s3Key,
      fileToDownload.fileName
    );
    res.status(200).json({
      signedUrl,
      fileName: fileToDownload.fileName,
      fileType: fileToDownload.fileType,
    });
  } catch (error) {
    console.error("Error generating download URL:", error);
    res.status(error.statusCode || 500);
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }
});

const getHomeworks = asyncHandler(async (req, res) => {
  const {
    subjectId,
    weekId,
    status,
    search,
    isMine,
    limit = 10,
    page = 1,
  } = req.query;

  const query = {};
  const user = req.user;

  if (!user) {
    res.status(401);
    throw new Error("Not authorized, no user token.");
  }

  if (user.role === "student") {
    query.status = "published";
  } else if (status) {
    query.status = status;
  }

  let allowedSubjectIds = [];
  if (user.role === "student") {
    const student = await User.findById(user._id).populate(
      "registeredSubjects"
    );
    if (student && student.registeredSubjects) {
      allowedSubjectIds = student.registeredSubjects.map((subject) =>
        subject._id.toString()
      );
    }
  } else if (user.role === "teacher") {
    const teacher = await User.findById(user._id).populate("assignedSubjects");
    if (teacher && teacher.assignedSubjects) {
      allowedSubjectIds = teacher.assignedSubjects.map((subject) =>
        subject._id.toString()
      );
    }
  }

  if (subjectId) {
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      res.status(400);
      throw new Error("Invalid subject ID format.");
    }
    if (
      user.role !== "admin" &&
      !allowedSubjectIds.includes(subjectId.toString())
    ) {
      res.status(403);
      throw new Error(
        "Forbidden: You do not have access to this subject's homeworks."
      );
    }
    query.subject = new mongoose.Types.ObjectId(subjectId);
  } else {
    if (user.role !== "admin" && allowedSubjectIds.length > 0) {
      query.subject = {
        $in: allowedSubjectIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    } else if (user.role !== "admin" && allowedSubjectIds.length === 0) {
      res.status(200).json({
        message: "No homeworks found matching the criteria.",
        homeworks: [],
        total: 0,
        page: parseInt(page),
        pages: 0,
      });
      return;
    }
  }

  if (weekId) {
    if (mongoose.Types.ObjectId.isValid(weekId)) {
      query.weekObjectId = new mongoose.Types.ObjectId(weekId);
    } else {
      const weekDoc = await Week.findOne({ weekNumber: parseInt(weekId) });
      if (weekDoc) {
        query.weekObjectId = weekDoc._id;
      } else {
        res.status(404);
        throw new Error("Week not found for the provided week number.");
      }
    }
  }

  if (search) {
    query.title = { $regex: search, $options: "i" };
  }

  if (isMine && user.role === "teacher") {
    query.uploadedBy = user._id;
  }

  try {
    const totalCount = await Homework.countDocuments(query);
    const homeworks = await Homework.find(query)
      .populate("subject", "name _id")
      .populate("uploadedBy", "profile.firstName profile.lastName")
      .populate({
        path: "submissions",
        select: "submissionStatus student",
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.status(200).json({
      homeworks,
      total: totalCount,
      page: parseInt(page),
      pages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error fetching homeworks:", error);
    res.status(500);
    throw new Error("Homeworks could not be fetched. Please try again later.");
  }
});

export {
  createHomework,
  getHomeworkById,
  updateHomework,
  deleteHomework,
  getSignedHomeworkDownloadUrl,
  getHomeworks,
};
