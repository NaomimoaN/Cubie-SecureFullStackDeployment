// server/routes/subjectRoutes.js

// To provide the functions that can
import express from "express";
import { protect, authorize } from "../../middleware/authMiddleware.js";
import * as subjectController from "../../controllers/model/subjectController.js";
// create a new router instance. This initializes a modular router for defining subject-related endpoints.
// Will be exported and mounted in the app.js
const router = express.Router();
// In app.js, app.use("/api/subjects", subjectRoutes);
// So here define a GET route for localhost:3000/api/subjects
router.get(
  "/",
  // middleware
  protect,
  // middleware that restrict the access only for the admit role
  authorize(["admin", "teacher"]),
  // Handler: a controller functions.Queries the Subject Model and fetch all the subject documents;
  // GET http://localhost:3000/api/subjects with a valid jwt cookie
  // Response will be JSON if success
  subjectController.getAllSubjects
);
router.get("/:subjectId", protect, subjectController.getSubjectById);

router.patch(
  "/:subjectId/description",
  protect,
  authorize(["teacher", "admin"]),
  subjectController.updateSubjectDescription
);

export default router;
