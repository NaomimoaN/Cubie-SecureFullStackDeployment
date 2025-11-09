import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { getCreatedAnnouncements, getAllAnnouncements, getParentsAnnouncements, getStudentsAnnouncements, postAnnouncement, getSignedUrlForFile, deleteAnnouncement, updateAnnouncement } from "../../controllers/announcement/announcementController.js";
import multer from "multer";
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

const router = express.Router();

router.get("/signed-url",
  protect,
  getSignedUrlForFile
)

router.post("/postNewAnnouncement",
  protect,
  upload.single("file"),
  postAnnouncement);

router.get("/created",
  protect,
  getCreatedAnnouncements);

router.get("/all",
  protect,
  getAllAnnouncements);

router.get("/students",
  protect,
  getStudentsAnnouncements);

router.get("/parents",
  protect,
  getParentsAnnouncements);

router.delete("/:id",
  protect,
  deleteAnnouncement);

router.put("/:id",
  protect,
  upload.single("file"),
  updateAnnouncement);

export default router;