import { Server } from "socket.io";
import logger from "./logger.js";
import { env } from "./env.js";
import { socketAuthMiddleware } from "../sockets/socket.auth.js";
import { registerChatHandlers } from "../sockets/chat.socket.js";

/**
 * createSocketServer — поднимает Socket.IO поверх переданного
 * httpServer (того же, что слушает Express — один порт на HTTP и WS).
 * CORS настроен так же, как у REST (см. app.js): один и тот же
 * CLIENT_URL, credentials: true.
 */
export const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl || false,
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    logger.debug(`Socket connected: user ${socket.userId}`);
    registerChatHandlers(io, socket);
  });

  return io;
};
