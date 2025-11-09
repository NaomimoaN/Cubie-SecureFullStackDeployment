import http from "http"; // for development
import dotenv from "dotenv";
import app from "./app.js";
import { setupSocket } from "./services/chatSocket.js";
import { setSocketIO } from "./routes/notificationRoutes.js";

dotenv.config();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO using the service (and save the returned io instance)
const io = setupSocket(server);

// Set the io instance for notification routes
setSocketIO(io);

const PORT = process.env.SOCKET_PORT || 5051;

// Start the server
server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
});
