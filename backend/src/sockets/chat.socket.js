import { MessageService } from "../services/message.service.js";
import { DEFAULT_ROOM, SOCKET_EVENTS, isValidRoom } from "../constants/chat.constants.js";
import { RoomPresence } from "./presence.js";
import logger from "../config/logger.js";

// Простая защита от флуда в оперативной памяти: не более N сообщений
// за скользящее окно на сокет-соединение. Для одного backend-инстанса
// этого достаточно; при горизонтальном масштабировании стоит перенести
// в Redis (по аналогии с OTP-лимитами), но пока это не требуется.
const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX_MESSAGES = 20;

function isRateLimited(socket) {
  const now = Date.now();
  const timestamps = (socket.data.messageTimestamps ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );

  if (timestamps.length >= RATE_LIMIT_MAX_MESSAGES) {
    socket.data.messageTimestamps = timestamps;
    return true;
  }

  timestamps.push(now);
  socket.data.messageTimestamps = timestamps;
  return false;
}

function broadcastRoomUsers(io, room) {
  io.to(room).emit(SOCKET_EVENTS.ROOM_USERS, {
    room,
    users: RoomPresence.listUsers(room),
    count: RoomPresence.countUsers(room),
  });
}

function broadcastRoomsState(io) {
  io.emit(SOCKET_EVENTS.ROOMS_STATE, RoomPresence.countsByRoom());
}

/**
 * joinRoom — переводит socket из текущей комнаты (если есть) в целевую:
 * обновляет и Socket.IO room (нужна для рассылки message:new только
 * участникам комнаты), и presence-реестр (нужен для подсчёта "кто
 * онлайн"), затем рассылает обновлённые данные всем, кого это касается,
 * и возвращает снапшот (история сообщений + участники) — это единый
 * ответ на room:join, второй отдельный запрос истории не нужен.
 */
async function joinRoom(io, socket, requestedRoom) {
  const targetRoom = isValidRoom(requestedRoom) ? requestedRoom : DEFAULT_ROOM;
  const previousRoom = socket.data.currentRoom;

  if (previousRoom !== targetRoom) {
    if (previousRoom) {
      socket.leave(previousRoom);
      RoomPresence.leave(previousRoom, socket.id);
      // Сам уходящий socket уже не состоит в Socket.IO room previousRoom
      // (socket.leave выше), поэтому этот emit до него не долетит — если
      // он был последним в комнате, получателей у события вообще 0, и
      // это нормально: актуальный (в т.ч. нулевой) счётчик уходящему
      // клиенту доставит broadcastRoomsState(io) ниже — тот всегда явно
      // включает count: 0 для опустевшей комнаты (см. presence.js).
      broadcastRoomUsers(io, previousRoom);
    }

    socket.join(targetRoom);
    RoomPresence.join(targetRoom, socket.id, {
      id: socket.data.userId,
      login: socket.data.login,
      gender: socket.data.gender,
    });
    socket.data.currentRoom = targetRoom;

    broadcastRoomUsers(io, targetRoom);
    broadcastRoomsState(io);
  }

  const messages = await MessageService.getHistory({ room: targetRoom });

  return {
    room: targetRoom,
    messages,
    users: RoomPresence.listUsers(targetRoom),
    count: RoomPresence.countUsers(targetRoom),
  };
}

export function registerChatSocket(io, socket) {
  // Комната по умолчанию НЕ назначается автоматически — клиент явно
  // запрашивает room:join сразу после connect (см. useChatSocket на
  // фронтенде). Так presence-реестр всегда отражает реальное намерение
  // клиента, а не серверное предположение о том, в какой комнате он "должен" быть.
  socket.on(SOCKET_EVENTS.ROOM_JOIN, async (payload, ack) => {
    const room = typeof payload === "string" ? payload : payload?.room;

    try {
      const snapshot = await joinRoom(io, socket, room);
      if (typeof ack === "function") {
        ack({ success: true, ...snapshot });
      }
    } catch (err) {
      logger.warn(
        `room:join failed for user ${socket.data.userId}: ${err.message}`,
      );
      if (typeof ack === "function") {
        ack({ success: false, message: "Failed to join room" });
      }
    }
  });

  socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload, ack) => {
    const respond = (result) => {
      if (typeof ack === "function") {
        ack(result);
      } else if (!result.success) {
        socket.emit(SOCKET_EVENTS.MESSAGE_ERROR, result);
      }
    };

    if (isRateLimited(socket)) {
      return respond({ success: false, code: "RATE_LIMITED", message: "Too many messages" });
    }

    const room = socket.data.currentRoom || DEFAULT_ROOM;
    const text = typeof payload === "string" ? payload : payload?.text;

    try {
      const message = await MessageService.sendMessage({
        authorId: socket.data.userId,
        authorLogin: socket.data.login,
        text,
        room,
      });

      // Рассылаем в room, включая самого отправителя — единый источник
      // истины (серверный id/timestamp), без отдельного оптимистичного
      // рендера на клиенте, который потом пришлось бы сверять/дедуплицировать.
      io.to(room).emit(SOCKET_EVENTS.MESSAGE_NEW, message);

      respond({ success: true });
    } catch (err) {
      logger.warn(
        `message:send rejected for user ${socket.data.userId}: ${err.message}`,
      );
      respond({
        success: false,
        code: err.code ?? "MESSAGE_REJECTED",
        message: err.message,
      });
    }
  });

  socket.on("disconnect", () => {
    const room = socket.data.currentRoom;
    if (!room) return;

    RoomPresence.leave(room, socket.id);
    broadcastRoomUsers(io, room);
    broadcastRoomsState(io);
  });
}