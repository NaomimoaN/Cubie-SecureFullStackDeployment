import asyncHandler from "express-async-handler";
import Announcement from "../../models/announcement.js";
import multer from "multer";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { generateDownloadSignedUrl } from "../../services/s3Service.js";

// configure AWS S3 client
// No need for the bucket name?
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure multer for file uploads, this is a middleware
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and PDF files are allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// GET /api/announcements/signed-url
export const getSignedUrlForFile = asyncHandler(async (req, res) => {
  const { key } = req.query;
  if (!key || typeof key !== "string") {
    return res.status(400).json({ error: "Valid file key is required" });
  }
  try {
    // Ensure key includes "announcements/" prefix
    const fullKey = key.startsWith("announcements/") ? key : `announcements/${key}`;
    const fileName = fullKey.split("/").pop().split("_").slice(1).join("_") || fullKey.split("/").pop();
    const signedUrl = await generateDownloadSignedUrl(fullKey, fileName);
    res.json({ signedUrl });
  } catch (error) {
    console.error("Error in getSignedUrlForFile:", error);
    res.status(500).json({ error: error.message || "Failed to generate signed URL" });
  }
});

export const postAnnouncement = asyncHandler(async (req, res) => {
  console.log("Received POST /api/announcements", {
    body: req.body,
    file: req.file?.originalname,
  });

  try {
    const { title, recipientGroup, description, created_by, creatorTitle, number_date } = req.body;

    // Validate the input
    if (!title || !recipientGroup || !description || !created_by) {
      console.log("Validation failed", { title, recipientGroup, description, created_by });
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate recipientGroup
    const validRecipientGroups = ["All", "Parents", "Students"];
    if (!validRecipientGroups.includes(recipientGroup)) {
      console.log("Invalid recipientGroup:", recipientGroup);
      return res.status(400).json({ error: "Invalid recipient group" });
    }

    // Prepare announcement data
    const announcementData = {
      title,
      recipient_group: recipientGroup,
      description,
      created_by,
      creatorTitle: creatorTitle || null,
      number_date: number_date || null,
    };

    // Handle file upload to S3 if file is provided
    if (req.file) {
      const fileKey = `announcements/${Date.now()}_${req.file.originalname}`;
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };
      await s3Client.send(new PutObjectCommand(params));
      announcementData.fileKey = fileKey; // Store fileKey in MongoDB
      announcementData.fileUrl = await generateDownloadSignedUrl(fileKey, req.file.originalname);
      console.log("File uploaded to S3 with key:", fileKey);
    }

    // Save to MongoDB
    const announcement = new Announcement(announcementData);
    await announcement.save();

    res.status(201).json({ message: "Announcement created successfully", announcement });
  } catch (error) {
    console.error("Error in postAnnouncement:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


export const getCreatedAnnouncements = asyncHandler(async (req, res) => {
  const userId = req.query.userId;
  // console.log("announcementController-L006:", userId);
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }
  const announcements = await Announcement.find({ created_by: userId }).sort({ creation_date: -1 });
  for (const announcement of announcements) {
    if (announcement.fileKey) {
      const fileName = announcement.fileKey.split("/").pop().split("_").slice(1).join("_") || announcement.fileKey.split("/").pop();
      announcement.fileUrl = await generateDownloadSignedUrl(announcement.fileKey, fileName);
    }
  }
  res.json(announcements);
});

export const getAllAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find({ recipient_group: "All" }).sort({ creation_date: -1 });
  for (const announcement of announcements) {
    if (announcement.fileKey) {
      const fileName = announcement.fileKey.split("/").pop().split("_").slice(1).join("_") || announcement.fileKey.split("/").pop();
      announcement.fileUrl = await generateDownloadSignedUrl(announcement.fileKey, fileName);
    }
  }
  res.json(announcements);
});

export const getParentsAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find({ recipient_group: "Parents" }).sort({ creation_date: -1 });
  for (const announcement of announcements) {
    if (announcement.fileKey) {
      const fileName = announcement.fileKey.split("/").pop().split("_").slice(1).join("_") || announcement.fileKey.split("/").pop();
      announcement.fileUrl = await generateDownloadSignedUrl(announcement.fileKey, fileName);
    }
  }
  res.json(announcements);
});

export const getStudentsAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find({ recipient_group: "Students" }).sort({ creation_date: -1 });
  for (const announcement of announcements) {
    if (announcement.fileKey) {
      const fileName = announcement.fileKey.split("/").pop().split("_").slice(1).join("_") || announcement.fileKey.split("/").pop();
      announcement.fileUrl = await generateDownloadSignedUrl(announcement.fileKey, fileName);
    }
  }
  res.json(announcements);
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const announcement = await Announcement.findById(id);

  if (!announcement) {
    res.status(404);
    throw new Error("Announcement not found");
  }

  // Delete associated S3 file if it exists
  if (announcement.fileKey) {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: announcement.fileKey,
    };
    await s3Client.send(new DeleteObjectCommand(params));
  }

  await Announcement.deleteOne({ _id: id });
  res.json({ message: "Announcement deleted successfully" });
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, recipient_group } = req.body;
  const announcement = await Announcement.findById(id);

  if (!announcement) {
    res.status(404);
    throw new Error("Announcement not found");
  }

  // Update fields
  announcement.title = title || announcement.title;
  announcement.description = description || announcement.description;
  announcement.recipient_group = recipient_group || announcement.recipient_group;

  // Handle file upload
  if (req.file) {
    // Delete old file from S3 if it exists
    if (announcement.fileKey) {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: announcement.fileKey,
      }));
    }
    // Upload new file
    const fileKey = `announcements/${Date.now()}_${req.file.originalname}`;
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };
    await s3Client.send(new PutObjectCommand(params));
    announcement.fileKey = fileKey;
    announcement.fileUrl = await generateDownloadSignedUrl(fileKey, req.file.originalname);
  }

  await announcement.save();
  res.json({ message: "Announcement updated successfully", announcement });
});