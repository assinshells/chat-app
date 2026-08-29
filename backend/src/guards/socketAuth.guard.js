import { TokenProvider } from "../providers/token.provider.js";
import { UserRepository } from "../repositories/user.repository.js";

/**
 * socketAuthGuard — Socket.IO middleware (io.use).
 * Ожидает access-токен в socket.handshake.auth.token (тот же токен,
 * что кладётся в Authorization: Bearer для REST) — cookie для сокетов
 * не подходит, т.к. handshake делается напрямую WebSocket-клиентом,
 * а не через axios-интерсептор.
 * В отличие от authGuard, дополнительно резолвит login и gender одним
 * запросом к БД при коннекте — login нужен на каждое сообщение, а gender
 * на список "кто онлайн" по комнатам; дешевле получить их один раз
 * и закэшировать в socket.data, чем ходить в БД на каждое событие.
 */
export const socketAuthGuard = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("ACCESS_TOKEN_INVALID"));

    const payload = TokenProvider.verifyAccessToken(token);
    const user = await UserRepository.findById(payload.sub);
    if (!user) return next(new Error("ACCESS_TOKEN_INVALID"));

    socket.data.userId = user.id;
    socket.data.login = user.login;
    socket.data.gender = user.gender;
    socket.data.color = user.color;
    next();
  } catch {
    next(new Error("ACCESS_TOKEN_INVALID"));
  }
};