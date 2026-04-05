import http from "http";
import app from "./src/app.js";
import { env } from "./src/config/env.js";
import { initSocketServer } from "./src/realtime/socketServer.js";

const PORT = env.port;
const server = http.createServer(app);

// Socket.io shares the same HTTP server so REST and realtime traffic
// stay on a single port during local development and deployment.
initSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${server.address().port}`);
});
