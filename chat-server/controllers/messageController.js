import asyncHandler from "express-async-handler";
import Message from "../models/Message.js";
import Group from "../models/Group.js";

// Get messages for a specific group
const getGroupMessages = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  // Validate groupId
  if (!groupId) {
    res.status(400);
    throw new Error("Group ID is required");
  }

  // Check if user is a member of the group
  const group = await Group.findById(groupId);
  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  // Check if user is a member of the group
  const isMember = group.members.some(
    (member) => member.user.toString() === req.user._id.toString()
  );

  if (!isMember) {
    res.status(403);
    throw new Error("You are not a member of this group");
  }

  // Calculate pagination
  const skip = (page - 1) * parseInt(limit);

  // Get total count for pagination info
  const totalMessages = await Message.countDocuments({ group: groupId });

  // Get messages with pagination, sorted by createdAt (newest first for pagination)
  const messages = await Message.find({ group: groupId })
    .populate("sender", "profile.firstName profile.lastName profile.avatarUrl")
    .sort({ createdAt: -1 }) // Newest messages first for pagination
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Reverse to get chronological order (oldest first) for display
  messages.reverse();

  const totalPages = Math.ceil(totalMessages / parseInt(limit));
  const hasNextPage = page < totalPages;

  res.status(200).json({
    messages,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalMessages,
      hasNextPage,
      hasMore: hasNextPage, // Keep for backward compatibility
    },
  });
});

// Get recent messages for a group (last 20 messages)
const getRecentMessages = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  // Validate groupId
  if (!groupId) {
    res.status(400);
    throw new Error("Group ID is required");
  }

  // Check if user is a member of the group
  const group = await Group.findById(groupId);
  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  const isMember = group.members.some(
    (member) => member.user.toString() === req.user._id.toString()
  );

  if (!isMember) {
    res.status(403);
    throw new Error("You are not a member of this group");
  }

  // Get last 20 messages
  const messages = await Message.find({ group: groupId })
    .populate("sender", "profile.firstName profile.lastName profile.avatarUrl")
    .sort({ createdAt: -1 }) // Newest first
    .limit(20)
    .lean();

  // Reverse to get chronological order (oldest first)
  messages.reverse();

  res.status(200).json({
    messages,
    totalMessages: messages.length,
  });
});

export { getGroupMessages, getRecentMessages };
