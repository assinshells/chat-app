import { socketAuthGuard } from "../guards/socketAuth.guard.js";
import { registerChatSocket } from "./chat.socket.js";
import logger from "../config/logger.js";

export function initSockets(io) {
  io.use(socketAuthGuard);

  io.on("connection", (socket) => {
    logger.debug(`Socket connected: user=${socket.data.userId} login=${socket.data.login}`);

    registerChatSocket(io, socket);

    socket.on("disconnect", (reason) => {
      logger.debug(`Socket disconnected: user=${socket.data.userId} reason=${reason}`);
    });
  });
}