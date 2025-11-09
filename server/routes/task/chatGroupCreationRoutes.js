import express from "express";
import { listUsersForGroupCreation } from "../../controllers/model/chatGroupCreationController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

// This route will provide a list of users for the group creation modal.
router.route("/users").get(protect, listUsersForGroupCreation);

export default router;
