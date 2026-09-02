import { Server } from "socket.io";
import { env } from "./env.js";

/**
 * createSocketServer — той самий CORS-контракт, що й у Express (app.js):
 * єдиний дозволений origin — CLIENT_URL, з credentials для
 * узгодженості (сам токен рукостискання передається в auth-payload, а не в cookie).
 */
export function createSocketServer(httpServer) {
  return new Server(httpServer, {
    cors: {
      origin: env.clientUrl || false,
      credentials: true,
    },
  });
}
