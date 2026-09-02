import { TokenProvider } from "../providers/token.provider.js";
import { UserRepository } from "../repositories/user.repository.js";

/**
 * socketAuthGuard — Socket.IO middleware (io.use).
 * Очікує access-токен у socket.handshake.auth.token (той самий токен,
 * що кладеться в Authorization: Bearer для REST) — cookie для сокетів
 * не підходить, оскільки handshake робиться напряму WebSocket-клієнтом,
 * а не через axios-інтерсептор.
 * На відміну від authGuard, додатково резолвить login і gender одним
 * запитом до БД при конекті — login потрібен на кожне повідомлення, а gender
 * на список "хто онлайн" по кімнатах; дешевше отримати їх один раз
 * і закешувати в socket.data, ніж ходити в БД на кожну подію.
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