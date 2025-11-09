// server/routes/adminRoutes.js

import express from "express";
import { protect, authorize } from "../../middleware/authMiddleware.js";
import { importUsers } from "../../controllers/task/adminController.js";
// Initialize a modular router for importUsers endpoint;
const router = express.Router();
// The post router
router.post("/users/import", protect, authorize(["admin"]), importUsers);

export default router;
