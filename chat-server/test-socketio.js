import { io } from "socket.io-client";

const socket = io("http://localhost:5051");

// MongoDB ObjectIDs format example (24-character hex strings)
const SENDER_ID = "507f1f77bcf86cd799439011";
const RECIPIENT_ID = "507f1f77bcf86cd799439022";

socket.on("connect", () => {
  console.log("Connected to server");

  // First join a room with your user ID
  socket.emit("join", { userId: SENDER_ID });
  console.log(`Joined as user: ${SENDER_ID}`);

  setTimeout(() => {
    console.log("Sending test message...");

    // Send properly formatted message data
    socket.emit("send-message", {
      chatType: "private",
      recipient: RECIPIENT_ID,
      content: "Hello, this is a test message!",
      sender: SENDER_ID,
    });

    console.log("Message sent");
  }, 1000);
});

socket.on("message-sent", (data) => {
  console.log("Received message-sent event:", data);
});

socket.on("receive-message", (data) => {
  console.log("Received message:", data);
});

socket.on("error", (error) => {
  console.error("Error:", error);
});

console.log("Starting test client...");
