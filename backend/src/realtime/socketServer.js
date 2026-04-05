import { Server } from "socket.io";
import { env } from "../config/env.js";
import { registerNotificationEmitter } from "../services/notificationService.js";

let io = null;

export function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins.length > 0 ? env.corsOrigins : true,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("notifications:subscribe", ({ profileId } = {}) => {
      if (!profileId) return;
      socket.join(`profile:${profileId}`);
    });

    socket.on("notifications:unsubscribe", ({ profileId } = {}) => {
      if (!profileId) return;
      socket.leave(`profile:${profileId}`);
    });
  });

  registerNotificationEmitter((room, payload) => {
    io?.to(room).emit("notifications:new", payload);
  });

  return io;
}

export function getSocketServer() {
  return io;
}
