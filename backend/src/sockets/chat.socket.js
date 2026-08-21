import logger from "../config/logger.js";
import { RoomService } from "../services/room.service.js";
import { MessageService } from "../services/message.service.js";
import { validateSendMessagePayload } from "../validators/chat.validator.js";
import { SOCKET_EVENTS } from "../constants/chat.constants.js";
import { BaseException } from "../exceptions/base.exception.js";
import { CHAT_ROOMS } from "../constants/rooms.data.js";

// Socket.IO room ≠ наша сущность "комната чата" — префикс избегает
// путаницы с чужими io.to()-каналами, если они появятся в будущем.
const roomChannel = (roomId) => `room:${roomId}`;

/**
 * getRoomUserCounts — сколько сокетов сейчас находятся в каждой
 * комнате из статического списка (CHAT_ROOMS). Источник правды —
 * io.sockets.adapter.rooms: отдельного счётчика в памяти не держим,
 * чтобы не рассинхронизироваться с реальным состоянием Socket.IO при
 * дисконнектах/реконнектах.
 */
const getRoomUserCounts = (io) => {
  const counts = {};
  for (const room of CHAT_ROOMS) {
    counts[room.id] = io.sockets.adapter.rooms.get(roomChannel(room.id))?.size ?? 0;
  }
  return counts;
};

const broadcastRoomUserCounts = (io) => {
  io.emit(SOCKET_EVENTS.ROOM_USER_COUNTS, getRoomUserCounts(io));
};

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
  // Новому соединению сразу отдаём текущий снимок счётчиков — иначе
  // список комнат на клиенте будет пустым/нулевым, пока сам клиент
  // не присоединится к какой-нибудь комнате.
  socket.emit(SOCKET_EVENTS.ROOM_USER_COUNTS, getRoomUserCounts(io));

  socket.on(SOCKET_EVENTS.ROOM_JOIN, async (roomId, ack) => {
    try {
      await RoomService.assertRoomExists(roomId);
      socket.join(roomChannel(roomId));
      ack?.({ success: true });
      broadcastRoomUserCounts(io);
    } catch (err) {
      ack?.({ success: false, error: toErrorPayload(err) });
    }
  });

  socket.on(SOCKET_EVENTS.ROOM_LEAVE, (roomId) => {
    socket.leave(roomChannel(roomId));
    broadcastRoomUserCounts(io);
  });

  socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload, ack) => {
    try {
      validateSendMessagePayload(payload);
      const message = await MessageService.sendMessage({
        roomId: payload.roomId,
        userId: socket.userId,
        content: payload.content.trim(),
        recipientIds: Array.isArray(payload.recipientIds) ? payload.recipientIds : [],
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
    // К этому моменту Socket.IO уже сам вывел сокет из всех комнат,
    // поэтому снимок можно просто пересчитать и разослать заново.
    broadcastRoomUserCounts(io);
  });
};