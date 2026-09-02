import { PrivateMessageService } from "../services/privateMessage.service.js";
import { SOCKET_EVENTS, dmChannel } from "../constants/chat.constants.js";
import logger from "../config/logger.js";

// Той самий принцип, що й у chat.socket.js — незалежний лічильник, свій
// власний ліміт на особисті повідомлення (не витрачає "бюджет" публічного
// чату і навпаки).
const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX_MESSAGES = 20;

function isRateLimited(socket) {
  const now = Date.now();
  const timestamps = (socket.data.dmTimestamps ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );

  if (timestamps.length >= RATE_LIMIT_MAX_MESSAGES) {
    socket.data.dmTimestamps = timestamps;
    return true;
  }

  timestamps.push(now);
  socket.data.dmTimestamps = timestamps;
  return false;
}

export function registerDmSocket(io, socket) {
  // Персональний канал користувача. На відміну від currentRoom (див.
  // chat.socket.js), сокет вступає сюди один раз при конекті і НЕ
  // покидає його ніколи за життя з'єднання — особисті повідомлення мають
  // долітати незалежно від того, в якій публічній кімнаті чату
  // користувач перебуває прямо зараз (або не перебуває в жодній).
  socket.join(dmChannel(socket.data.userId));

  // dm:open — історія листування з конкретним співрозмовником (за
  // логіном), запитується при відкритті вкладки в DirectMessagesModal.
  // Аналог room:join для DM, тільки без побічних ефектів на presence —
  // відкрити діалог не означає "увійти" кудись, це просто читання історії.
  socket.on(SOCKET_EVENTS.DM_OPEN, async (payload, ack) => {
    const login = typeof payload === "string" ? payload : payload?.login;

    try {
      const messages = await PrivateMessageService.getConversation({
        userId: socket.data.userId,
        otherLogin: login,
      });
      if (typeof ack === "function") {
        ack({ success: true, login, messages });
      }
    } catch (err) {
      logger.warn(`dm:open не вдався для користувача ${socket.data.userId}: ${err.message}`);
      if (typeof ack === "function") {
        ack({ success: false, message: "Не вдалося відкрити діалог" });
      }
    }
  });

  // dm:list — зведення по всіх діалогах (вертикальні вкладки в модалці).
  socket.on(SOCKET_EVENTS.DM_LIST, async (_payload, ack) => {
    try {
      const conversations = await PrivateMessageService.listConversations({
        userId: socket.data.userId,
      });
      if (typeof ack === "function") {
        ack({ success: true, conversations });
      }
    } catch (err) {
      logger.warn(`dm:list не вдався для користувача ${socket.data.userId}: ${err.message}`);
      if (typeof ack === "function") {
        ack({ success: false, message: "Не вдалося завантажити діалоги" });
      }
    }
  });

  socket.on(SOCKET_EVENTS.DM_SEND, async (payload, ack) => {
    const respond = (result) => {
      if (typeof ack === "function") {
        ack(result);
      } else if (!result.success) {
        socket.emit(SOCKET_EVENTS.DM_ERROR, result);
      }
    };

    if (isRateLimited(socket)) {
      return respond({
        success: false,
        code: "RATE_LIMITED",
        message: "Забагато повідомлень",
      });
    }

    const recipientLogin = typeof payload === "object" ? payload?.to : undefined;
    const text = typeof payload === "object" ? payload?.text : undefined;

    try {
      const { message, recipientId } =
        await PrivateMessageService.sendPrivateMessage({
          senderId: socket.data.userId,
          senderLogin: socket.data.login,
          recipientLogin,
          text,
        });

      // Особистий канал одержувача + особистий канал самого відправника
      // (луна на всі його вкладки/пристрої) — єдине джерело істини, без
      // окремого оптимістичного рендеру на клієнті, так само як і для
      // публічних повідомлень (див. сусідній коментар про
      // broadcastRoomUsers у chat.socket.js про io.to(room).emit, включно
      // з відправником).
      io.to(dmChannel(recipientId))
        .to(dmChannel(socket.data.userId))
        .emit(SOCKET_EVENTS.DM_NEW, message);

      respond({ success: true });
    } catch (err) {
      logger.warn(
        `dm:send відхилено для користувача ${socket.data.userId}: ${err.message}`,
      );
      respond({
        success: false,
        code: err.code ?? "PRIVATE_MESSAGE_REJECTED",
        message: err.message,
      });
    }
  });
}
