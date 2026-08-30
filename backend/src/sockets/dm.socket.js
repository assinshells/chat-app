import { PrivateMessageService } from "../services/privateMessage.service.js";
import { SOCKET_EVENTS, dmChannel } from "../constants/chat.constants.js";
import logger from "../config/logger.js";

// Тот же принцип, что и в chat.socket.js — независимый счётчик, свой
// собственный лимит на личные сообщения (не расходует "бюджет" публичного
// чата и наоборот).
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
  // Персональный канал пользователя. В отличие от currentRoom (см.
  // chat.socket.js), сокет вступает сюда один раз при коннекте и НЕ
  // покидает его никогда за жизнь соединения — личные сообщения должны
  // долетать независимо от того, в какой публичной комнате чата
  // пользователь находится прямо сейчас (или не находится ни в какой).
  socket.join(dmChannel(socket.data.userId));

  // dm:open — история переписки с конкретным собеседником (по логину),
  // запрашивается при открытии вкладки в DirectMessagesModal. Аналог
  // room:join для DM, только без побочных эффектов на presence — открыть
  // диалог не значит "войти" куда-либо, это просто чтение истории.
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
      logger.warn(`dm:open failed for user ${socket.data.userId}: ${err.message}`);
      if (typeof ack === "function") {
        ack({ success: false, message: "Failed to open conversation" });
      }
    }
  });

  // dm:list — сводка по всем диалогам (вертикальные вкладки в модалке).
  socket.on(SOCKET_EVENTS.DM_LIST, async (_payload, ack) => {
    try {
      const conversations = await PrivateMessageService.listConversations({
        userId: socket.data.userId,
      });
      if (typeof ack === "function") {
        ack({ success: true, conversations });
      }
    } catch (err) {
      logger.warn(`dm:list failed for user ${socket.data.userId}: ${err.message}`);
      if (typeof ack === "function") {
        ack({ success: false, message: "Failed to load conversations" });
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
        message: "Too many messages",
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

      // Личный канал получателя + личный канал самого отправителя (эхо
      // на все его вкладки/устройства) — единый источник истины, без
      // отдельного оптимистичного рендера на клиенте, ровно как и для
      // публичных сообщений (см. broadcastRoomUsers-соседний комментарий
      // в chat.socket.js про io.to(room).emit, включая отправителя).
      io.to(dmChannel(recipientId))
        .to(dmChannel(socket.data.userId))
        .emit(SOCKET_EVENTS.DM_NEW, message);

      respond({ success: true });
    } catch (err) {
      logger.warn(
        `dm:send rejected for user ${socket.data.userId}: ${err.message}`,
      );
      respond({
        success: false,
        code: err.code ?? "PRIVATE_MESSAGE_REJECTED",
        message: err.message,
      });
    }
  });
}
