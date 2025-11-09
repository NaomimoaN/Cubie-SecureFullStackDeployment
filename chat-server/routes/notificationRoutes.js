import express from "express";

const router = express.Router();

// Store the io instance to be set from server.js
let io = null;

// Function to set the io instance
export const setSocketIO = (socketIO) => {
  io = socketIO;
};

// API endpoint to send notifications
router.post("/send", async (req, res) => {
  try {
    console.log("📨 Notification API called with:", req.body);
    
    const { userId, notification } = req.body;
    
    if (!userId || !notification) {
      console.log("❌ Missing userId or notification");
      return res.status(400).json({
        success: false,
        message: "userId and notification are required"
      });
    }
    
    // Send notification via Socket.IO to the specific user
    if (io) {
      const eventName = `notification-${userId}`;
      console.log(`📡 Emitting Socket.IO event: ${eventName}`);
      console.log(`📝 Notification payload:`, notification);
      
      io.emit(eventName, notification);
      console.log(`✅ Notification sent to user ${userId}:`, notification);
    } else {
      console.warn("⚠️ Socket.IO not initialized");
    }
    
    res.json({
      success: true,
      message: "Notification sent successfully"
    });
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message
    });
  }
});

export default router;