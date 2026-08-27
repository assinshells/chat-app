import { Server } from "socket.io";
import { env } from "./env.js";

/**
 * createSocketServer — тот же CORS-контракт, что и у Express (app.js):
 * единственный разрешённый origin — CLIENT_URL, с credentials для
 * согласованности (сам handshake токен несёт в auth-payload, не в cookie).
 */
export function createSocketServer(httpServer) {
  return new Server(httpServer, {
    cors: {
      origin: env.clientUrl || false,
      credentials: true,
    },
  });
}