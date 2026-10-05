import { Server } from "socket.io";
import { env } from "./env.js";

/**
 * createSocketServer — той самий CORS-контракт, що й у Express (app.js):
 * єдиний дозволений origin — CLIENT_URL, з credentials для
 * узгодженості (сам токен рукостискання передається в auth-payload, а не в cookie).
 */
export function createSocketServer(httpServer) {
  return new Server(httpServer, {
    // Зображення (≤1 МБ, див. IMAGE_LIMITS) їдуть бінарним вкладенням у
    // message:send/dm:send — дефолтних 1e6 байт замало з урахуванням
    // службових даних пакета.
    maxHttpBufferSize: 1.5e6,
    cors: {
      origin: env.clientUrl || false,
      credentials: true,
    },
  });
}
