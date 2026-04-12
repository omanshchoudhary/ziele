import http from "http";
import app from "./src/app.js";
import { env } from "./src/config/env.js";
import { initSocketServer } from "./src/realtime/socketServer.js";

// Use process.env.PORT for cloud deployment compatibility
const PORT = process.env.PORT || env.port || 3000;

// Add a GET "/" route to return a simple message
app.get("/", (req, res) => {
  res.send("Backend is live ");
});

// Create the HTTP server
const server = http.createServer(app);

// Initialize Socket.io server
initSocketServer(server);

// Listen on the specified port and bind to "0.0.0.0" for cloud compatibility
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
