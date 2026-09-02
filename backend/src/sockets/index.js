import { socketAuthGuard } from "../guards/socketAuth.guard.js";
import { registerChatSocket } from "./chat.socket.js";
import { registerDmSocket } from "./dm.socket.js";
import logger from "../config/logger.js";

export function initSockets(io) {
  io.use(socketAuthGuard);

  io.on("connection", (socket) => {
    logger.debug(`Сокет підключено: user=${socket.data.userId} login=${socket.data.login}`);

    registerChatSocket(io, socket);
    registerDmSocket(io, socket);

    socket.on("disconnect", (reason) => {
      logger.debug(`Сокет відключено: user=${socket.data.userId} reason=${reason}`);
    });
  });
}
