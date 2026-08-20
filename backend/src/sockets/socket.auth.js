import { TokenProvider } from "../providers/token.provider.js";

/**
 * socketAuthMiddleware — аналог authGuard, но для Socket.IO handshake.
 * Клиент передаёт accessToken через `auth: { token }` при подключении
 * (см. frontend shared/lib/socket.js) — тот же принцип, что и заголовок
 * Authorization: Bearer у REST, просто в другом транспорте. Токен
 * stateless (без обращения к БД/Redis), поэтому проверка такая же
 * дешёвая, как и в authGuard.
 */
export const socketAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("UNAUTHORIZED"));

  try {
    const payload = TokenProvider.verifyAccessToken(token);
    socket.userId = payload.sub;
    next();
  } catch {
    next(new Error("UNAUTHORIZED"));
  }
};
