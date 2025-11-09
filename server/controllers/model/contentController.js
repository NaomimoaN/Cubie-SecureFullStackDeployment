// server/controllers/model/contentController.js

import asyncHandler from "express-async-handler";
import Content from "../../models/contentModel.js";
import Subject from "../../models/subjectModel.js";
import Week from "../../models/weekModel.js";
import User from "../../models/userModel.js";
import {
  deleteFile,
  uploadFile,
  generateDownloadSignedUrl,
} from "../../services/s3Service.js";
import { sendContentNotification } from "../../utils/notificationHelper.js";
import mongoose from "mongoose";

const createContent = asyncHandler(async (req, res) => {
  if (!req.user || (req.user.role !== "teacher" && req.user.role !== "admin")) {
    res.status(403);
    throw new Error("Forbidden: Only teachers and admins can create content.");
  }

  const { title, description, week_id, subject_id } = req.body;
  const uploadedFiles = req.files;

  const uploadedBy = req.user._id;

  if (!title || !week_id || !subject_id) {
    res.status(400);
    throw new Error("Title, Week ID, and Subject ID are required.");
  }

  if (
    !mongoose.Types.ObjectId.isValid(subject_id) ||
    !mongoose.Types.ObjectId.isValid(week_id)
  ) {
    res.status(400);
    throw new Error("Invalid Subject ID or Week ID format.");
  }

  if (!uploadedFiles || uploadedFiles.length === 0) {
    res.status(400);
    throw new Error("At least one file is required for content creation.");
  }

  let uploadedS3Keys = [];

  try {
    const weekDoc = await Week.findById(week_id);
    if (!weekDoc) {
      res.status(400);
      throw new Error("Selected week not found.");
    }

    const subjectDoc = await Subject.findById(subject_id);
    if (!subjectDoc) {
      res.status(400);
      throw new Error("Selected subject not found.");
    }

    const contentMetadataArray = [];

    for (const file of uploadedFiles) {
      const fileName = file.originalname;
      const fileType = file.mimetype;
      const s3Key = `contents/${subject_id}/${week_id}/${fileName.replace(
        /\s/g,
        "_"
      )}`;

      try {
        await uploadFile(file.buffer, s3Key, fileType);
        uploadedS3Keys.push(s3Key);

        const fileURL = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${s3Key}`;

        contentMetadataArray.push({
          fileName: fileName,
          s3Key: s3Key,
          fileType: fileType,
          fileURL: fileURL,
          size: file.size,
        });
      } catch (s3UploadError) {
        console.error(`Error uploading file ${fileName} to S3:`, s3UploadError);
        res.status(500);
        throw new Error(`Failed to upload file to S3: ${fileName}`);
      }
    }

    const newContent = await Content.create({
      title,
      description,
      subject: new mongoose.Types.ObjectId(subject_id),
      week: new mongoose.Types.ObjectId(week_id),
      contents: contentMetadataArray,
      uploadedBy: new mongoose.Types.ObjectId(uploadedBy),
    });

    if (newContent) {
      await Week.findByIdAndUpdate(
        weekDoc._id,
        { $push: { contents: newContent._id } },
        { new: true, runValidators: true }
      );

      // Send notification to students about new content
      try {
        await sendContentNotification(
          {
            _id: newContent._id,
            title: newContent.title,
            subject: newContent.subject,
            subjectName: subjectDoc.name,
            week: weekDoc.weekNumber,
          },
          "created"
        );
      } catch (notificationError) {
        console.error(
          "Failed to send content notification:",
          notificationError
        );
        // Don't throw error as content was created successfully
      }

      res.status(201).json({
        message: "Content created successfully!",
        content: newContent,
      });
    } else {
      res.status(500);
      throw new Error("Failed to create content document unexpectedly.");
    }
  } catch (createError) {
    if (uploadedS3Keys.length > 0) {
      console.error(
        "Attempting to rollback S3 uploads due to DB error or other failure:",
        uploadedS3Keys
      );
      for (const key of uploadedS3Keys) {
        try {
          await deleteFile(key);
          // console.log(`Successfully rolled back S3 file: ${key}`);
        } catch (s3RollbackError) {
          console.error(`Failed to rollback S3 file ${key}:`, s3RollbackError);
        }
      }
    }

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
        "Failed to create new content document. Please try again."
    );
  }
});

const getContentById = asyncHandler(async (req, res) => {
  const content = req.content;

  if (!content) {
    res.status(404);
    throw new Error("Content not found.");
  }

  const populatedContent = await Content.findById(content._id)
    .populate("subject", "name _id")
    .populate("uploadedBy", "profile.firstName profile.lastName");

  if (!populatedContent) {
    res.status(404);
    throw new Error("Content not found after re-population.");
  }

  res.status(200).json(populatedContent);
});

const updateContent = asyncHandler(async (req, res) => {
  const content = req.content;

  if (!content) {
    res.status(404);
    throw new Error("Content not found or you do not have access.");
  }

  const {
    title,
    description,
    week_id: newSelectedWeekId,
    subject_id: newSubjectId,
    s3KeyToDelete,
  } = req.body;
  const uploadedFiles = req.files;

  if (!title || !newSelectedWeekId || !newSubjectId) {
    res.status(400);
    throw new Error(
      "Missing required fields for update: title, week ID, subject ID."
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(newSubjectId) ||
    !mongoose.Types.ObjectId.isValid(newSelectedWeekId)
  ) {
    res.status(400);
    throw new Error("Invalid Subject ID or Week ID format for update.");
  }

  let updatedContentMetadata = [...content.contents];

  const keysToDelete = Array.isArray(s3KeyToDelete)
    ? s3KeyToDelete
    : s3KeyToDelete
    ? [s3KeyToDelete]
    : [];

  for (const key of keysToDelete) {
    const indexToDelete = updatedContentMetadata.findIndex(
      (file) => file.s3Key === key
    );
    if (indexToDelete !== -1) {
      try {
        await deleteFile(key);
        updatedContentMetadata.splice(indexToDelete, 1);
      } catch (s3DeleteError) {
        console.error(
          `Error deleting S3 file ${key} during update:`,
          s3DeleteError
        );
      }
    }
  }

  let newlyUploadedKeys = [];
  if (uploadedFiles && uploadedFiles.length > 0) {
    for (const file of uploadedFiles) {
      const fileName = file.originalname;
      const fileType = file.mimetype;
      const s3Key = `contents/${newSubjectId}/${newSelectedWeekId}/${fileName.replace(
        /\s/g,
        "_"
      )}`;

      try {
        await uploadFile(file.buffer, s3Key, fileType);
        newlyUploadedKeys.push(s3Key);

        const fileURL = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${s3Key}`;
        updatedContentMetadata.push({
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
        for (const key of newlyUploadedKeys) {
          try {
            await deleteFile(key);
          } catch (rollbackErr) {
            console.error(
              `Failed to rollback newly uploaded S3 file ${key}:`,
              rollbackErr
            );
          }
        }
        res.status(500);
        throw new Error(`Failed to upload new file to S3: ${fileName}`);
      }
    }
  }

  const oldWeekObjectId = content.week;
  if (oldWeekObjectId && oldWeekObjectId.toString() !== newSelectedWeekId) {
    await Week.findByIdAndUpdate(
      oldWeekObjectId,
      { $pull: { contents: content._id } },
      { new: true, runValidators: true }
    );
    await Week.findByIdAndUpdate(
      newSelectedWeekId,
      { $push: { contents: content._id } },
      { new: true, runValidators: true }
    );
    content.week = new mongoose.Types.ObjectId(newSelectedWeekId);
  }

  content.title = title;
  content.description = description;
  content.contents = updatedContentMetadata;

  try {
    const updatedContent = await content.save();

    // Send notification to students about content update
    try {
      const subjectDoc = await Subject.findById(updatedContent.subject);
      const weekDoc = await Week.findById(updatedContent.week);
      await sendContentNotification(
        {
          _id: updatedContent._id,
          title: updatedContent.title,
          subject: updatedContent.subject,
          subjectName: subjectDoc ? subjectDoc.name : "Unknown Subject",
          week: weekDoc ? weekDoc.weekNumber : "Unknown Week",
        },
        "updated"
      );
    } catch (notificationError) {
      console.error(
        "Failed to send content update notification:",
        notificationError
      );
      // Don't throw error as content was updated successfully
    }

    res.status(200).json({
      message: "Content updated successfully.",
      content: updatedContent,
    });
  } catch (saveError) {
    if (newlyUploadedKeys.length > 0) {
      for (const key of newlyUploadedKeys) {
        try {
          await deleteFile(key);
        } catch (rollbackErr) {
          console.error(
            `Failed to rollback newly uploaded S3 file ${key} after DB save error:`,
            rollbackErr
          );
        }
      }
    }

    if (saveError.name === "ValidationError") {
      const messages = Object.values(saveError.errors).map(
        (val) => val.message
      );
      res.status(400);
      throw new Error(`Validation Error during save: ${messages.join(", ")}`);
    }
    res.status(500);
    throw new Error("Failed to save content document to DB. Please try again.");
  }
});

const deleteContent = asyncHandler(async (req, res) => {
  const content = req.content;

  if (!content) {
    res.status(404);
    throw new Error("Content not found or you do not have access.");
  }

  // Store content info for notification before deletion
  const contentForNotification = {
    _id: content._id,
    title: content.title,
    subject: content.subject,
    week: content.week,
  };

  // Get subject and week names for notification
  let subjectName = "Unknown Subject";
  let weekNumber = "Unknown Week";
  try {
    const subjectDoc = await Subject.findById(content.subject);
    if (subjectDoc) {
      subjectName = subjectDoc.name;
    }
    const weekDoc = await Week.findById(content.week);
    if (weekDoc) {
      weekNumber = weekDoc.weekNumber;
    }
  } catch (error) {
    console.error("Error fetching subject/week for notification:", error);
  }

  if (content.contents && content.contents.length > 0) {
    for (const fileMetadata of content.contents) {
      if (fileMetadata.s3Key) {
        try {
          await deleteFile(fileMetadata.s3Key);
        } catch (s3DeleteError) {
          console.error(
            `Error deleting S3 file ${fileMetadata.s3Key}:`,
            s3DeleteError
          );
        }
      }
    }
  }

  try {
    if (content.week) {
      await Week.findByIdAndUpdate(
        content.week,
        { $pull: { contents: content._id } },
        { new: true, runValidators: true }
      );
    }

    await Content.findByIdAndDelete(content._id);

    // Send notification to students about content deletion
    try {
      await sendContentNotification(
        {
          _id: contentForNotification._id,
          title: contentForNotification.title,
          subject: contentForNotification.subject,
          subjectName: subjectName,
          week: weekNumber,
        },
        "deleted"
      );
    } catch (notificationError) {
      console.error(
        "Failed to send content deletion notification:",
        notificationError
      );
      // Don't throw error as content was deleted successfully
    }

    res.status(200).json({
      message: "Content and associated S3 files deleted successfully.",
      deletedContentId: content._id,
    });
  } catch (dbError) {
    console.error(`Error deleting content document from DB:`, dbError);
    res.status(500);
    throw new Error(`Failed to delete content document from DB.`);
  }
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
    const signedUrl = await generateDownloadSignedUrl(fileKey, contentType);
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

const getSignedContentDownloadUrl = asyncHandler(async (req, res) => {
  const content = req.content;

  if (!content) {
    res.status(404);
    throw new Error("Content not found.");
  }

  const { s3Key } = req.query;

  const decodedS3Key = s3Key;

  const fileToDownload = content.contents.find(
    (file) => file.s3Key === decodedS3Key
  );

  if (!fileToDownload) {
    res.status(404);
    throw new Error("Content file S3 key not found in content document.");
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
    res.status(error.statusCode || 500);
    throw new Error(
      `Failed to generate download URL for content file: ${error.message}`
    );
  }
});

const getContents = asyncHandler(async (req, res) => {
  const { subjectId, weekId, search, isMine, limit = 10, page = 1 } = req.query;

  const query = {};
  const user = req.user;

  if (!user) {
    res.status(401);
    throw new Error("Not authorized, no user token.");
  }

  if (user.role === "student") {
    const student = await User.findById(user._id).populate(
      "registeredSubjects"
    );
    if (!student) {
      res.status(404);
      throw new Error("Student profile not found.");
    }
    const enrolledSubjectIds = student.registeredSubjects.map(
      (subject) => subject._id
    );
    query.subject = { $in: enrolledSubjectIds };
  } else if (user.role === "teacher") {
    const teacher = await User.findById(user._id).populate("assignedSubjects");
    if (!teacher) {
      res.status(404);
      throw new Error("Teacher profile not found.");
    }
    const assignedSubjectIds = teacher.assignedSubjects.map(
      (subject) => subject._id
    );
    query.subject = { $in: assignedSubjectIds };
  }

  if (subjectId) {
    if (query.subject && query.subject.$in) {
      query.subject.$in = query.subject.$in.filter((id) =>
        id.equals(new mongoose.Types.ObjectId(subjectId))
      );
    } else {
      query.subject = new mongoose.Types.ObjectId(subjectId);
    }
  }

  if (weekId) {
    if (mongoose.Types.ObjectId.isValid(weekId)) {
      query.week = new mongoose.Types.ObjectId(weekId);
    } else {
      res.status(400);
      throw new Error("Invalid week ID format. Must be an ObjectId.");
    }
  }

  if (search) {
    query.title = { $regex: search, $options: "i" };
  }

  if (isMine && user.role === "teacher") {
    query.uploadedBy = user._id;
  }

  try {
    const totalCount = await Content.countDocuments(query);
    const contents = await Content.find(query)
      .populate("subject", "name _id")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    if (!contents || contents.length === 0) {
      res.status(200).json({
        message: "No content found matching the criteria.",
        contents: [],
        total: 0,
        page: parseInt(page),
        pages: 0,
      });
      return;
    }

    res.status(200).json({
      contents,
      total: totalCount,
      page: parseInt(page),
      pages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error fetching contents:", error);
    res.status(500);
    throw new Error("Contents could not be fetched. Please try again later.");
  }
});

export {
  createContent,
  getContentById,
  updateContent,
  deleteContent,
  getSignedContentUploadUrl,
  getSignedContentDownloadUrl,
  getContents,
};
