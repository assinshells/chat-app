import logger from "../config/logger.js";
import { RoomService } from "../services/room.service.js";
import { MessageService } from "../services/message.service.js";
import { validateSendMessagePayload } from "../validators/chat.validator.js";
import { SOCKET_EVENTS } from "../constants/chat.constants.js";
import { BaseException } from "../exceptions/base.exception.js";

// Socket.IO room ≠ наша сущность "комната чата" — префикс избегает
// путаницы с чужими io.to()-каналами, если они появятся в будущем.
const roomChannel = (roomId) => `room:${roomId}`;

const toErrorPayload = (err) => {
  if (err instanceof BaseException) {
    return { code: err.code, message: err.message };
  }
  logger.error(`Socket handler error: ${err.message}`, { stack: err.stack });
  return { code: "INTERNAL_ERROR", message: "Internal server error" };
};

/**
 * registerChatHandlers — вся Socket.IO-логика чата для одного
 * соединения. "Rooms" в этом MVP — публичные каналы: любой
 * авторизованный пользователь может присоединиться и писать в любую
 * существующую комнату (членства/приглашений нет — это сознательное
 * упрощение, см. обсуждение приватных чатов в README).
 */
export const registerChatHandlers = (io, socket) => {
  socket.on(SOCKET_EVENTS.ROOM_JOIN, async (roomId, ack) => {
    try {
      await RoomService.assertRoomExists(roomId);
      socket.join(roomChannel(roomId));
      ack?.({ success: true });
    } catch (err) {
      ack?.({ success: false, error: toErrorPayload(err) });
    }
  });

  socket.on(SOCKET_EVENTS.ROOM_LEAVE, (roomId) => {
    socket.leave(roomChannel(roomId));
  });

  socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload, ack) => {
    try {
      validateSendMessagePayload(payload);
      const message = await MessageService.sendMessage({
        roomId: payload.roomId,
        userId: socket.userId,
        content: payload.content.trim(),
      });
      // Рассылаем всем в комнате, включая отправителя — так его
      // собственное сообщение попадает в ленту тем же путём (message:new),
      // что и чужие, без отдельной ветки "оптимистично добавить своё".
      io.to(roomChannel(message.roomId)).emit(SOCKET_EVENTS.MESSAGE_NEW, message);
      ack?.({ success: true, message });
    } catch (err) {
      ack?.({ success: false, error: toErrorPayload(err) });
    }
  });

  socket.on("disconnect", () => {
    logger.debug(`Socket disconnected: user ${socket.userId}`);
  });
};
