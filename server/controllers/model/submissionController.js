// server/controllers/model/submissionController.js

import asyncHandler from "express-async-handler";
import Homework from "../../models/homeworkModel.js";
import Submission from "../../models/submissionModel.js";
import User from "../../models/userModel.js";
import Annotation from "../../models/annotationModel.js";
import {
  uploadFile,
  deleteFile,
  generateSignedUrlForPdf,
  generateDownloadSignedUrl,
} from "../../services/s3Service.js";
import mongoose from "mongoose";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { sendParentGradeUpdateNotification } from "../../utils/notificationHelper.js";

const ANNOTATION_TEXT_HEIGHT_OFFSET = 16;

const rollbackS3Uploads = async (s3Keys) => {
  if (s3Keys && s3Keys.length > 0) {
    for (const key of s3Keys) {
      try {
        await deleteFile(key);
      } catch (rollbackError) {
        console.error("Failed to rollback S3 file:", key, rollbackError);
      }
    }
  }
};

const updateSubmissionGrade = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { score, feedback, letterGrade, rubricScores, submissionStatus } =
    req.body;

  if (!req.user || (req.user.role !== "teacher" && req.user.role !== "admin")) {
    res.status(403);
    throw new Error(
      "Forbidden: Only teachers and admins can grade submissions."
    );
  }

  const submission = await Submission.findById(submissionId);

  if (!submission) {
    res.status(404);
    throw new Error("Submission not found.");
  }

  if (!submission.grade) {
    submission.grade = {};
  }

  if (score !== undefined) submission.grade.score = score;
  if (feedback !== undefined) submission.grade.feedback = feedback;
  if (letterGrade !== undefined) submission.grade.letterGrade = letterGrade;
  if (rubricScores !== undefined) submission.grade.rubricScores = rubricScores;

  submission.grade.gradedBy = req.user._id;
  submission.grade.gradedAt = new Date();

  submission.submissionStatus = submissionStatus || "graded";
  submission.isLocked = true;

  try {
    const updatedSubmission = await submission.save();

    const populatedUpdatedSubmission = await Submission.findById(
      updatedSubmission._id
    )
      .populate(
        "homework",
        "title description dueDate week status coreCompetencies rubricEmerging rubricDeveloping rubricProficient rubricExtending"
      )
      .populate("student", "profile.firstName profile.lastName profile.parent")
      .populate("grade.gradedBy", "profile.firstName profile.lastName")
      .populate({
        path: "homework",
        populate: {
          path: "subject",
          select: "name",
        },
      });

    // Send grade update notification to parent if student has a parent
    if (populatedUpdatedSubmission.student.profile.parent) {
      const studentName = `${populatedUpdatedSubmission.student.profile.firstName} ${populatedUpdatedSubmission.student.profile.lastName}`;
      const subjectName =
        populatedUpdatedSubmission.homework.subject?.name || "Unknown Subject";
      const gradeDisplay =
        populatedUpdatedSubmission.grade.letterGrade ||
        populatedUpdatedSubmission.grade.score ||
        "Grade Updated";

      await sendParentGradeUpdateNotification({
        parentId: populatedUpdatedSubmission.student.profile.parent,
        studentName: studentName,
        subject: subjectName,
        grade: gradeDisplay,
        studentId: populatedUpdatedSubmission.student._id,
      });
    }

    res.status(200).json(populatedUpdatedSubmission);
  } catch (error) {
    console.error("Error updating submission grade:", error);
    res.status(500);
    throw new Error("Failed to update submission grade. Please try again.");
  }
});

const submitHomework = asyncHandler(async (req, res) => {
  const { homeworkId } = req.params;
  const user = req.user;
  const uploadedFiles = req.files;

  if (user.role !== "student") {
    res.status(403);
    throw new Error("Forbidden: Only students can submit homework.");
  }

  const homework = await Homework.findById(homeworkId);
  if (!homework) {
    res.status(404);
    throw new Error("Homework not found.");
  }

  if (homework.dueDate && new Date() > new Date(homework.dueDate)) {
    res.status(403);
    throw new Error("Forbidden: Homework submission deadline has passed.");
  }

  let existingSubmission = await Submission.findOne({
    homework: homeworkId,
    student: user._id,
  });

  if (!existingSubmission) {
    res.status(404);
    throw new Error(
      "Assigned submission not found for this homework and student. Please contact your teacher."
    );
  }

  if (existingSubmission.isLocked) {
    res.status(400);
    throw new Error("Cannot submit: Your submission has been locked.");
  }

  const { annotation: annotationId } = req.body;

  if (!uploadedFiles || uploadedFiles.length === 0) {
    res.status(400);
    throw new Error("No files provided for submission.");
  }

  let finalSubmittedFiles = [];
  let uploadedS3Keys = [];

  try {
    for (const file of uploadedFiles) {
      const sanitizedFileName = file.originalname.replace(/\s/g, "_");
      const fileExtension = sanitizedFileName.split(".").pop();
      const baseName = sanitizedFileName.substring(
        0,
        sanitizedFileName.lastIndexOf(".") === -1
          ? sanitizedFileName.length
          : sanitizedFileName.lastIndexOf(".")
      );

      const finalFileNameForS3Key = `${baseName}-${Date.now()}${
        fileExtension ? `.${fileExtension}` : ""
      }`;

      if (file.mimetype === "application/pdf") {
        const originalPdfFileName = file.originalname;
        const originalPdfBuffer = file.buffer;

        const pdfDoc = await PDFDocument.load(originalPdfBuffer);
        const pages = pdfDoc.getPages();

        let studentAnnotation;
        if (annotationId) {
          studentAnnotation = await Annotation.findById(annotationId);
        } else {
          studentAnnotation = await Annotation.findOne({
            submission: existingSubmission._id,
            owner: user._id,
            type: "student",
          }).sort({ createdAt: -1 });
        }

        if (
          studentAnnotation &&
          studentAnnotation.data &&
          Object.keys(studentAnnotation.data).length > 0
        ) {
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

          for (const pageNumStr in studentAnnotation.data) {
            const pageNum = parseInt(pageNumStr, 10);
            const annotationsOnPage = studentAnnotation.data[pageNumStr];

            if (annotationsOnPage && annotationsOnPage.length > 0) {
              const pageIndex = pageNum - 1;
              if (pageIndex >= 0 && pageIndex < pages.length) {
                const page = pages[pageIndex];

                for (const annotation of annotationsOnPage) {
                  if (annotation.type === "text") {
                    const drawX = Number.isFinite(annotation.x)
                      ? annotation.x
                      : 0;
                    const pageHeight = page.getHeight();
                    const drawY =
                      pageHeight -
                      (annotation.y + ANNOTATION_TEXT_HEIGHT_OFFSET);

                    const drawFontSize = Number.isFinite(annotation.fontSize)
                      ? annotation.fontSize
                      : 12;

                    let textColor = rgb(0, 0, 0);
                    if (annotation.color) {
                      const hex = annotation.color.startsWith("#")
                        ? annotation.color.slice(1)
                        : annotation.color;
                      if (hex.length === 6) {
                        const r = parseInt(hex.substring(0, 2), 16) / 255;
                        const g = parseInt(hex.substring(2, 4), 16) / 255;
                        const b = parseInt(hex.substring(4, 6), 16) / 255;
                        textColor = rgb(r, g, b);
                      }
                    }

                    page.drawText(annotation.text, {
                      x: drawX,
                      y: drawY,
                      font: font,
                      size: drawFontSize,
                      color: textColor,
                    });
                  }
                }
              }
            }
          }
        }

        const modifiedPdfBytes = await pdfDoc.save();
        const newS3Key = `submissions/flattened/${user._id.toString()}/${homeworkId}/${finalFileNameForS3Key}`;
        const uploadedFileLocation = await uploadFile(
          Buffer.from(modifiedPdfBytes),
          newS3Key,
          "application/pdf"
        );
        uploadedS3Keys.push(newS3Key);

        finalSubmittedFiles.push({
          fileName: originalPdfFileName,
          s3Key: newS3Key,
          fileType: "application/pdf",
          uploadedAt: new Date(),
          fileURL: uploadedFileLocation,
          size: file.size,
        });

        if (studentAnnotation && annotationId) {
          await Annotation.findByIdAndDelete(studentAnnotation._id);
        }
      } else {
        const fileName = file.originalname;
        const fileType = file.mimetype;
        const s3Key = `submissions/original/${user._id.toString()}/${homeworkId}/${finalFileNameForS3Key}`;
        const uploadedFileLocation = await uploadFile(
          file.buffer,
          s3Key,
          fileType
        );
        uploadedS3Keys.push(s3Key);

        finalSubmittedFiles.push({
          fileName: fileName,
          s3Key: s3Key,
          fileType: fileType,
          uploadedAt: new Date(),
          fileURL: uploadedFileLocation,
          size: file.size,
        });
      }
    }

    existingSubmission.submittedFiles = finalSubmittedFiles;
    existingSubmission.submittedAt = new Date();
    existingSubmission.submissionStatus = "submitted";
    existingSubmission.annotation = annotationId || null;

    const updatedSubmission = await existingSubmission.save();

    const populatedUpdatedSubmission = await updatedSubmission.populate([
      { path: "student", select: "profile.firstName profile.lastName" },
      { path: "homework", select: "title description dueDate week" },
      { path: "annotation" },
    ]);

    res.status(200).json({
      message: "Homework submitted successfully!",
      submission: populatedUpdatedSubmission,
    });
  } catch (dbError) {
    await rollbackS3Uploads(uploadedS3Keys);

    console.error("Failed to update submission document in DB:", dbError);
    if (!res.headersSent) {
      res.status(500);
    }
    throw new Error("Failed to update submission document in DB.");
  }
});

const getSubmissionById = asyncHandler(async (req, res) => {
  const submission = req.submission;

  if (!submission) {
    res.status(404);
    throw new Error("Submission not found.");
  }

  const populatedSubmission = await Submission.findById(submission._id)
    .populate(
      "homework",
      "title description dueDate week status coreCompetencies rubricEmerging rubricDeveloping rubricProficient rubricExtending"
    )
    .populate("student", "profile.firstName profile.lastName")
    .populate("grade.gradedBy", "profile.firstName profile.lastName")
    .populate("annotation");

  if (!populatedSubmission) {
    res.status(500);
    throw new Error("Failed to retrieve populated submission.");
  }

  res.status(200).json(populatedSubmission);
});

const updateSubmission = asyncHandler(async (req, res) => {
  const submission = req.submission;
  const user = req.user;
  const uploadedFiles = req.files;

  if (
    user.role !== "student" ||
    submission.student._id.toString() !== user._id.toString()
  ) {
    res.status(403);
    throw new Error("Forbidden: You can only update your own submissions.");
  }

  if (submission.isLocked) {
    res.status(400);
    throw new Error("Cannot update submission: It has been graded or locked.");
  }

  const { s3KeysToDelete, annotation: annotationId } = req.body;

  if (annotationId !== undefined) {
    submission.annotation = annotationId;
  }

  let currentFiles = submission.submittedFiles || [];
  let newlyUploadedKeys = [];

  try {
    if (s3KeysToDelete && s3KeysToDelete.length > 0) {
      for (const s3Key of s3KeysToDelete) {
        const initialLength = currentFiles.length;
        currentFiles = currentFiles.filter((file) => file.s3Key !== s3Key);
        if (currentFiles.length < initialLength) {
          try {
            await deleteFile(s3Key);
          } catch (s3DeleteError) {
            console.error("Error deleting S3 file:", s3Key, s3DeleteError);
          }
        }
      }
    }

    if (uploadedFiles && uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        const sanitizedFileName = file.originalname.replace(/\s/g, "_");
        const fileNameParts = sanitizedFileName.split(".");
        const extension = fileNameParts.length > 1 ? fileNameParts.pop() : "";
        const baseName = sanitizedFileName.substring(
          0,
          sanitizedFileName.lastIndexOf(".") === -1
            ? sanitizedFileName.length
            : sanitizedFileName.lastIndexOf(".")
        );

        const finalFileNameForS3Key = `${baseName}-${Date.now()}${
          extension ? `.${extension}` : ""
        }`;

        if (file.mimetype === "application/pdf") {
          const originalPdfFileName = file.originalname;
          const originalPdfBuffer = file.buffer;

          const pdfDoc = await PDFDocument.load(originalPdfBuffer);
          const pages = pdfDoc.getPages();

          let studentAnnotation;
          if (annotationId) {
            studentAnnotation = await Annotation.findById(annotationId);
          } else {
            studentAnnotation = await Annotation.findOne({
              submission: submission._id,
              owner: user._id,
              type: "student",
            }).sort({ createdAt: -1 });
          }

          if (
            studentAnnotation &&
            studentAnnotation.data &&
            Object.keys(studentAnnotation.data).length > 0
          ) {
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            for (const pageNumStr in studentAnnotation.data) {
              const pageNum = parseInt(pageNumStr, 10);
              const annotationsOnPage = studentAnnotation.data[pageNumStr];
              if (annotationsOnPage && annotationsOnPage.length > 0) {
                const pageIndex = pageNum - 1;
                if (pageIndex >= 0 && pageIndex < pages.length) {
                  const page = pages[pageIndex];
                  for (const annotation of annotationsOnPage) {
                    if (annotation.type === "text") {
                      const drawX = Number.isFinite(annotation.x)
                        ? annotation.x
                        : 0;
                      const pageHeight = page.getHeight();
                      const drawY =
                        pageHeight -
                        (annotation.y + ANNOTATION_TEXT_HEIGHT_OFFSET);
                      const drawFontSize = Number.isFinite(annotation.fontSize)
                        ? annotation.fontSize
                        : 12;
                      let textColor = rgb(0, 0, 0);
                      if (annotation.color) {
                        const hex = annotation.color.startsWith("#")
                          ? annotation.color.slice(1)
                          : annotation.color;
                        if (hex.length === 6) {
                          const r = parseInt(hex.substring(0, 2), 16) / 255;
                          const g = parseInt(hex.substring(2, 4), 16) / 255;
                          const b = parseInt(hex.substring(4, 6), 16) / 255;
                          textColor = rgb(r, g, b);
                        }
                      }
                      page.drawText(annotation.text, {
                        x: drawX,
                        y: drawY,
                        font: font,
                        size: drawFontSize,
                        color: textColor,
                      });
                    }
                  }
                }
              }
            }
          }

          const modifiedPdfBytes = await pdfDoc.save();
          const homeworkIdString = submission.homework._id.toString();

          const s3KeyForPdf = `submissions/flattened/${user._id.toString()}/${homeworkIdString}/${finalFileNameForS3Key}`;

          const uploadedFileLocation = await uploadFile(
            Buffer.from(modifiedPdfBytes),
            s3KeyForPdf,
            "application/pdf"
          );
          newlyUploadedKeys.push(s3KeyForPdf);

          currentFiles.push({
            fileName: originalPdfFileName,
            s3Key: s3KeyForPdf,
            fileType: "application/pdf",
            uploadedAt: new Date(),
            fileURL: uploadedFileLocation,
            size: file.size,
          });

          if (studentAnnotation && annotationId) {
            await Annotation.findByIdAndDelete(studentAnnotation._id);
          }
        } else {
          const fileName = file.originalname;
          const fileType = file.mimetype;
          const homeworkIdString = submission.homework._id.toString();

          const s3KeyForOther = `submissions/original/${user._id.toString()}/${homeworkIdString}/${finalFileNameForS3Key}`;

          const uploadedFileLocation = await uploadFile(
            file.buffer,
            s3KeyForOther,
            fileType
          );
          newlyUploadedKeys.push(s3KeyForOther);

          currentFiles.push({
            fileName: fileName,
            s3Key: s3KeyForOther,
            fileType: fileType,
            uploadedAt: new Date(),
            fileURL: uploadedFileLocation,
            size: file.size,
          });
        }
      }
    }

    submission.submittedFiles = currentFiles;
    submission.submittedAt = new Date();
    submission.submissionStatus = "submitted";

    const updatedSubmission = await submission.save();

    const populatedSubmission = await Submission.findById(updatedSubmission._id)
      .populate("student", "profile.firstName profile.lastName")
      .populate("grade.gradedBy", "profile.firstName profile.lastName")
      .populate("homework", "title dueDate")
      .populate("annotation");

    res.status(200).json({
      message: "Submission updated successfully!",
      submission: populatedSubmission,
    });
  } catch (dbError) {
    await rollbackS3Uploads(newlyUploadedKeys);

    console.error("Failed to update submission document in DB:", dbError);
    if (!res.headersSent) {
      res.status(500);
    }
    throw new Error("Failed to update submission document in DB.");
  }
});

const deleteSubmission = asyncHandler(async (req, res) => {
  const submission = req.submission;
  const user = req.user;

  if (
    user.role !== "student" ||
    submission.student._id.toString() !== user._id.toString()
  ) {
    res.status(403);
    throw new Error("Forbidden: You can only delete your own submissions.");
  }

  if (submission.isLocked) {
    res.status(400);
    throw new Error("Cannot delete submission: It has been graded or locked.");
  }

  const filesToDeleteFromS3 = submission.submittedFiles.map(
    (file) => file.s3Key
  );

  try {
    if (submission.annotation) {
      await Annotation.findByIdAndDelete(submission.annotation);
    }

    await rollbackS3Uploads(filesToDeleteFromS3);

    await Submission.findByIdAndDelete(submission._id);

    await Homework.findByIdAndUpdate(submission.homework._id, {
      $pull: { submissions: submission._id },
    });

    res.status(200).json({
      message: "Submission and all associated files deleted successfully.",
      deletedSubmissionId: submission._id,
    });
  } catch (dbError) {
    console.error("Error deleting submission from DB:", dbError);
    res.status(500);
    throw new Error("Failed to delete submission from DB.");
  }
});

const getSignedSubmissionDisplayUrl = asyncHandler(async (req, res) => {
  const submission = req.submission;
  const { s3KeyParam } = req.params;

  if (!submission) {
    res.status(404);
    throw new Error("Submission not found.");
  }

  const decodedS3Key = decodeURIComponent(s3KeyParam);

  const fileToDownload = submission.submittedFiles.find(
    (file) => file.s3Key === decodedS3Key
  );

  if (!fileToDownload) {
    res.status(404);
    throw new Error(
      `File with S3 key "${decodedS3Key}" not found within this submission.`
    );
  }

  try {
    const signedUrl = await generateSignedUrlForPdf(decodedS3Key);
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

const getSignedSubmissionDownloadUrl = asyncHandler(async (req, res) => {
  const submission = req.submission;
  const { s3KeyParam } = req.params;

  if (!submission) {
    res.status(404);
    throw new Error("Submission not found.");
  }

  const decodedS3Key = decodeURIComponent(s3KeyParam);

  const fileToDownload = submission.submittedFiles.find(
    (file) => file.s3Key === decodedS3Key
  );

  if (!fileToDownload) {
    res.status(404);
    throw new Error(
      `File with S3 key "${decodedS3Key}" not found within this submission.`
    );
  }

  try {
    const signedUrl = await generateDownloadSignedUrl(
      decodedS3Key,
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

const getUserSubmissions = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(subjectId)) {
    res.status(400);
    throw new Error("Invalid subject ID format.");
  }

  const submissions = await Submission.find({ student: user._id })
    .populate({
      path: "homework",
      match: {
        subject: new mongoose.Types.ObjectId(subjectId),
        status: "published",
      },
      select: "title description dueDate week status",
    })
    .populate("student", "profile.firstName profile.lastName")
    .populate("grade.gradedBy", "profile.firstName profile.lastName")
    .populate("annotation");

  const filteredSubmissions = submissions.filter(
    (submission) => submission.homework !== null
  );

  res.status(200).json(filteredSubmissions);
});

const getSubmissionsByHomeworkId = asyncHandler(async (req, res) => {
  const { homeworkId } = req.params;

  if (!["teacher", "admin"].includes(req.user.role)) {
    res.status(403);
    throw new Error("Not authorized to view these submissions.");
  }

  if (!mongoose.Types.ObjectId.isValid(homeworkId)) {
    res.status(400);
    throw new Error("Invalid homework ID format.");
  }

  const submissions = await Submission.find({ homework: homeworkId })
    .populate("student", "profile.firstName profile.lastName")
    .populate("annotation")
    .sort({ submittedAt: -1 });

  res.status(200).json(submissions);
});

const getAllUserSubmissions = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role !== "student") {
    res.status(403);
    throw new Error("Forbidden: Only students can view all their submissions.");
  }

  let submissions = await Submission.find({ student: user._id })
    .populate("student", "profile.firstName profile.lastName")
    .populate("grade.gradedBy", "profile.firstName profile.lastName")
    .populate("annotation")
    .lean();

  const homeworkIds = submissions.map((sub) => sub.homework).filter(Boolean);

  const homeworksMap = new Map();
  if (homeworkIds.length > 0) {
    const homeworks = await Homework.find({
      _id: { $in: homeworkIds },
    })
      .select("title description dueDate week status subject")
      .populate("subject", "name");

    homeworks.forEach((hw) => homeworksMap.set(hw._id.toString(), hw));
  }

  const finalSubmissions = [];
  for (const sub of submissions) {
    const homework = homeworksMap.get(sub.homework.toString());

    if (
      !homework ||
      homework.status !== "published" ||
      sub.submissionStatus !== "assigned"
    ) {
      continue;
    }

    sub.homework = homework;
    finalSubmissions.push(sub);
  }

  res.status(200).json(finalSubmissions);
});

export {
  submitHomework,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
  updateSubmissionGrade,
  getSignedSubmissionDisplayUrl,
  getSignedSubmissionDownloadUrl,
  getUserSubmissions,
  getSubmissionsByHomeworkId,
  getAllUserSubmissions,
};
