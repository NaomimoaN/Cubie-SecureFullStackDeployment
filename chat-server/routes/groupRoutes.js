import express from "express";
import { createGroup, getGroups, addMembersToGroup, removeMemberFromGroup } from "../controllers/groupController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes in this file are protected and require a valid token
router.use(protect);

// Route to get all groups for the logged-in user and create a new group
router.route("/").get(getGroups).post(createGroup);

// Route to add members to an existing group
router.route("/:groupId/members").post(addMembersToGroup);

// Route to remove a member from an existing group
router.route("/:groupId/members/:memberId").delete(removeMemberFromGroup);

export default router;
