import { SOCKET_EVENTS, dmChannel } from "../constants/chat.constants.js";
import logger from "../config/logger.js";

/**
 * singleSessionGuard — Socket.IO middleware: один акаунт = одна активна
 * сесія. Коли той самий userId підключається вдруге (інший браузер,
 * вкладка, пристрій), усі попередні його сокети витісняються: отримують
 * SESSION_REPLACED і розриваються з боку сервера.
 *
 * Це закриває обидві проблеми: неможливо сидіти в різних кімнатах одним
 * ніком одночасно і неможливо бути "двома користувачами" в одній кімнаті.
 *
 * Серверний розрив (disconnect з reason "io server disconnect")
 * socket.io-client НЕ перепідключає автоматично, тож витіснені вкладки
 * не воюватимуть із новою сесією у нескінченному циклі.
 *
 * Працює в парі з disconnect-обробником у chat.socket.js: він сам
 * прибирає сокет із presence і розсилає оновлений склад кімнати;
 * прапорець socket.data.replaced лише вимикає повідомлення "Покидає чат".
 *
 * Викликається ДО події "connection", тому новий сокет ще не в
 * dmChannel і fetchSockets() повертає тільки старі з'єднання.
 * (fetchSockets() без adapter повертає реальні локальні Socket-інстанси
 * — див. коментар у moderationEnforcement.js.)
 */
export const singleSessionGuard = (io) => async (socket, next) => {
  try {
    const userId = socket.data.userId;
    if (!userId) return next();

    const previous = await io.in(dmChannel(userId)).fetchSockets();
    for (const old of previous) {
      if (old.id === socket.id) continue;
      old.data.replaced = true;
      old.emit(SOCKET_EVENTS.SESSION_REPLACED);
      old.disconnect(true);
    }

    if (previous.length > 0) {
      logger.debug(`Сесію user=${userId} витіснено новим підключенням (${previous.length})`);
    }
    next();
  } catch (err) {
    logger.warn(`singleSessionGuard: ${err.message}`);
    // Не блокуємо вхід через збій витіснення — presence і так
    // дедуплікується за userId (див. sockets/presence.js).
    next();
  }
};
