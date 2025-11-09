import { Server } from "socket.io";
import Message from "../models/Message.js";
import Group from "../models/Group.js";
import profanityFilter from "../utils/profanityFilter.js";

export function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN_URL || "*", // for development, to be updated later.
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Store active users and their socket IDs
  const activeUsers = new Map();

  io.on("connection", (socket) => {
    console.log("Socket connected: ", socket.id);

    // Join user's personal room
    socket.on("join", ({ userId }) => {
      if (!userId) {
        socket.emit("error", { message: "User ID is required" });
        return;
      }

      socket.join(userId);
      socket.userId = userId;
      activeUsers.set(userId, socket.id);
      console.log(`User ${userId} joined personal room (${socket.id})`);

      // Broadcast user's online status to others
      socket.broadcast.emit("user-status-change", {
        userId,
        status: "online",
      });
    });

    // Handle sending a group message
    socket.on("send-message", async (data) => {
      const { content, sender, group } = data;

      if (!content || !sender || !group) {
        socket.emit("error", {
          message: "Missing required message data: content, sender, or group",
        });
        return;
      }

      try {
        // Filter profanity from message content
        const filteredContent = profanityFilter(content);
        
        // Group message data
        const messageData = {
          sender,
          content: filteredContent,
          chatType: "group",
          group,
          readBy: [sender], // Sender has read the message
        };

        // Save to database
        const message = new Message(messageData);
        await message.save();

        // Update the group's lastMessage field
        await Group.findByIdAndUpdate(group, { lastMessage: message._id });

        // Populate the sender's info to include name, etc, before broadcasting
        const populatedMessage = await Message.findById(message._id).populate(
          "sender",
          "profile"
        );

        // Send the rich message object to all members in the group room
        io.to(`group:${group}`).emit("receive-message", populatedMessage);

        console.log(`Group message sent to group ${group} by ${sender}`);

        // Send confirmation to sender
        socket.emit("message-sent", {
          success: true,
          messageId: message._id,
          createdAt: message.createdAt,
        });
      } catch (error) {
        console.error("Error processing group message:", error);
        socket.emit("error", {
          message: "Failed to send group message",
          details: error.message,
        });
      }
    });

    // Handle joining a group chat room
    socket.on("join-group", ({ groupId, userId }) => {
      if (!groupId) {
        socket.emit("error", { message: "Group ID is required" });
        return;
      }

      if (!userId) {
        socket.emit("error", { message: "User ID is required" });
        return;
      }

      socket.join(`group:${groupId}`);
      socket.userId = userId;
      console.log(`User ${userId} joined group ${groupId}`);

      // Notify other group members that user joined
      socket.to(`group:${groupId}`).emit("user-joined-group", {
        userId,
        groupId,
        timestamp: new Date(),
      });
    });

    // Handle leaving a group chat room
    socket.on("leave-group", ({ groupId, userId }) => {
      if (!groupId || !userId) {
        socket.emit("error", { message: "Group ID and User ID are required" });
        return;
      }

      socket.leave(`group:${groupId}`);
      console.log(`User ${userId} left group ${groupId}`);

      // Notify other group members that user left
      socket.to(`group:${groupId}`).emit("user-left-group", {
        userId,
        groupId,
        timestamp: new Date(),
      });
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
      if (socket.userId) {
        activeUsers.delete(socket.userId);
        console.log(`User ${socket.userId} disconnected`);

        // Broadcast user's offline status
        socket.broadcast.emit("user-status-change", {
          userId: socket.userId,
          status: "offline",
        });
      }
    });
  });

  return io;
}
