import asyncHandler from "express-async-handler";
import Group from "../models/Group.js";

// NOTE: This controller is designed to work after an authentication middleware
// has processed the request. It assumes the middleware adds the user's
// information (req.user = { _id, role }) to the request object.

const createGroup = asyncHandler(async (req, res) => {
  // 1. Authorization Check: Is the requesting user a teacher?
  if (req.user.role !== "teacher") {
    res.status(403); // 403 Forbidden
    throw new Error("Only teachers are authorized to create groups.");
  }

  // 2. Get Data: Expect group name and members from the frontend.
  const { name, description, members } = req.body;

  // Basic validation: Group name and member list are required.
  if (!name || !members || !Array.isArray(members) || members.length === 0) {
    res.status(400); // 400 Bad Request
    throw new Error("Please provide a group name and a list of members.");
  }

  // 3. Create the Group:
  // The teacher creating the group should also be a member.
  // 'members' array from the frontend contains objects like: { user: "studentId" }
  const memberList = members.map((m) => ({ user: m.user, role: "student" }));

  const finalMembers = [...memberList, { user: req.user._id, role: "teacher" }];

  // Remove any duplicate users to ensure data integrity.
  const uniqueMembers = Array.from(
    new Map(finalMembers.map((m) => [m.user.toString(), m])).values()
  );

  const group = new Group({
    name,
    description: description || "",
    creator: req.user._id,
    members: uniqueMembers,
  });

  const createdGroup = await group.save();
  res.status(201).json(createdGroup); // 201 Created
});

const getGroups = asyncHandler(async (req, res) => {
  // I use the 'findByUser' static method defined in our model.
  const groups = await Group.findByUser(req.user._id);
  res.status(200).json(groups);
});

const addMembersToGroup = asyncHandler(async (req, res) => {
  // 1. Authorization Check: Is the requesting user a teacher?
  if (req.user.role !== "teacher") {
    res.status(403); // 403 Forbidden
    throw new Error("Only teachers are authorized to add members to groups.");
  }

  // 2. Get Data: Expect group ID from params and members from body
  const { groupId } = req.params;
  const { members } = req.body;

  // Basic validation
  if (!members || !Array.isArray(members) || members.length === 0) {
    res.status(400); // 400 Bad Request
    throw new Error("Please provide a list of members to add.");
  }

  // 3. Find the group
  const group = await Group.findById(groupId);
  if (!group) {
    res.status(404); // 404 Not Found
    throw new Error("Group not found.");
  }

  // 4. Check if the requesting user is a member of the group
  const isTeacherInGroup = group.members.some(
    (member) => member.user.toString() === req.user._id.toString() && member.role === "teacher"
  );

  if (!isTeacherInGroup) {
    res.status(403); // 403 Forbidden
    throw new Error("You are not authorized to modify this group.");
  }

  // 5. Prepare new members and add them to the group
  const newMembers = members.map((m) => ({ user: m.user, role: "student" }));
  
  // Get existing member user IDs to avoid duplicates
  const existingMemberIds = group.members.map(member => member.user.toString());
  
  // Filter out users who are already members
  const membersToAdd = newMembers.filter(
    newMember => !existingMemberIds.includes(newMember.user.toString())
  );

  if (membersToAdd.length === 0) {
    res.status(400);
    throw new Error("All selected users are already members of this group.");
  }

  // Add new members to the group
  group.members.push(...membersToAdd);
  
  await group.save();
  
  // Return the updated group
  const updatedGroup = await Group.findById(groupId).populate('members.user');
  res.status(200).json(updatedGroup);
});

const removeMemberFromGroup = asyncHandler(async (req, res) => {
  // 1. Authorization Check: Is the requesting user a teacher?
  if (req.user.role !== "teacher") {
    res.status(403); // 403 Forbidden
    throw new Error("Only teachers are authorized to remove members from groups.");
  }

  // 2. Get Data: Expect group ID and member ID from params
  const { groupId, memberId } = req.params;

  // 3. Find the group
  const group = await Group.findById(groupId);
  if (!group) {
    res.status(404); // 404 Not Found
    throw new Error("Group not found.");
  }

  // 4. Check if the requesting user is a teacher in the group
  const isTeacherInGroup = group.members.some(
    (member) => member.user.toString() === req.user._id.toString() && member.role === "teacher"
  );

  if (!isTeacherInGroup) {
    res.status(403); // 403 Forbidden
    throw new Error("You are not authorized to modify this group.");
  }

  // 5. Find the member to remove
  const memberToRemove = group.members.find(
    (member) => member.user.toString() === memberId
  );

  if (!memberToRemove) {
    res.status(404);
    throw new Error("Member not found in this group.");
  }

  // 6. Prevent removing teachers
  if (memberToRemove.role === "teacher") {
    res.status(403);
    throw new Error("Cannot remove teachers from the group.");
  }

  // 7. Remove the member
  group.members = group.members.filter(
    (member) => member.user.toString() !== memberId
  );

  await group.save();

  // Return the updated group
  const updatedGroup = await Group.findById(groupId).populate('members.user');
  res.status(200).json(updatedGroup);
});

export { createGroup, getGroups, addMembersToGroup, removeMemberFromGroup };
