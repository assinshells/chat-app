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

/**
 * checkRateLimit — возвращает { limited: false } либо { limited: true,
 * retryAfterMs }. retryAfterMs — сколько ждать до момента, когда самое
 * старое сообщение в окне "устареет" и освободит слот (окно
 * скользящее, а не фиксированное, поэтому это не просто "секунда до
 * конца окна", а точное время до следующего разрешённого слота).
 * Раньше функция возвращала просто boolean — фронтенду нечем было бы
 * показать обратный отсчёт до конца лимита без этого числа.
 */
function checkRateLimit(socket) {
  const now = Date.now();
  const timestamps = (socket.data.messageTimestamps ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );

  if (timestamps.length >= RATE_LIMIT_MAX_MESSAGES) {
    socket.data.messageTimestamps = timestamps;
    const oldest = timestamps[0];
    return { limited: true, retryAfterMs: RATE_LIMIT_WINDOW_MS - (now - oldest) };
  }

  timestamps.push(now);
  socket.data.messageTimestamps = timestamps;
  return { limited: false };
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
 * broadcastSystemEvent — рассылает системное сообщение (вход/переход/
 * выход) участникам КОНКРЕТНОЙ Socket.IO room через io.to(scopeRoom) —
 * не глобально. scopeRoom — это КОМУ виден эффект (кто должен увидеть
 * строку в своей ленте), а payload.room — это НАЗВАНИЕ комнаты,
 * упомянутое в тексте сообщения; для события 'switch' они РАЗНЫЕ:
 * рассылается в СТАРУЮ комнату (scopeRoom), а текст называет НОВУЮ
 * (payload.room), см. joinRoom ниже. Текст сообщения не зависит от пола
 * пользователя (см. widgets/chat-conversation) — gender сюда сознательно
 * не передаётся.
 */
function broadcastSystemEvent(io, scopeRoom, { event, login, color, room }) {
  io.to(scopeRoom).emit(SOCKET_EVENTS.SYSTEM_EVENT, {
    id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "system",
    event,
    login,
    color,
    room,
    timestamp: Date.now(),
  });
}

/**
 * joinRoom — переводит socket из текущей комнаты (если есть) в целевую:
 * обновляет и Socket.IO room (нужна для рассылки message:new только
 * участникам комнаты), и presence-реестр (нужен для подсчёта "кто
 * онлайн"), затем возвращает снапшот (история сообщений + участники) —
 * это единый ответ на room:join, второй отдельный запрос истории не нужен.
 *
 * Системные события (вхід/перехід) НЕ рассылаются отсюда напрямую —
 * функция лишь СОБИРАЕТ их в systemEvents и возвращает вызывающему
 * коду (см. SOCKET_EVENTS.ROOM_JOIN ниже), чтобы тот разослал их уже
 * ПОСЛЕ отправки ack с историей. Это важно: если разослать их раньше
 * ack, клиент получит live-событие "Добро пожаловать" раньше, чем ack
 * со снапшотом истории, а обработчик ack безусловно делает
 * setMessages(result.messages) — это стёрло бы уже отрисованное
 * системное сообщение (гонка состояний, из-за которой оно "мигало" и
 * пропадало).
 */
async function joinRoom(io, socket, requestedRoom) {
  const targetRoom = isValidRoom(requestedRoom) ? requestedRoom : DEFAULT_ROOM;
  const previousRoom = socket.data.currentRoom;
  const systemEvents = [];

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

      // "Переходит в комнату X" — видят ТОЛЬКО те, кто остался в СТАРОЙ
      // комнате (scopeRoom = previousRoom); сам переходящий это уже не
      // увидит (он вышел из previousRoom строкой выше) — и это верно,
      // ему через мгновение придёт свой "Добро пожаловать" в новую.
      systemEvents.push({
        scopeRoom: previousRoom,
        payload: {
          event: "switch",
          login: socket.data.login,
          color: socket.data.color,
          room: targetRoom,
        },
      });
    }

    socket.join(targetRoom);
    RoomPresence.join(targetRoom, socket.id, {
      id: socket.data.userId,
      login: socket.data.login,
      gender: socket.data.gender,
      color: socket.data.color,
    });
    socket.data.currentRoom = targetRoom;

    broadcastRoomUsers(io, targetRoom);
    broadcastRoomsState(io);

    // "Добро пожаловать в чат" — видят ВСЕ, кто сейчас в целевой
    // комнате (включая самого вошедшего, он уже participant targetRoom
    // после socket.join выше), независимо от того, первый это вход за
    // сессию или переход из другой комнаты — сообщение одинаковое.
    systemEvents.push({
      scopeRoom: targetRoom,
      payload: {
        event: "join",
        login: socket.data.login,
        color: socket.data.color,
        room: targetRoom,
      },
    });
  }

  const messages = await MessageService.getHistory({ room: targetRoom });

  return {
    snapshot: {
      room: targetRoom,
      messages,
      users: RoomPresence.listUsers(targetRoom),
      count: RoomPresence.countUsers(targetRoom),
    },
    systemEvents,
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
      const { snapshot, systemEvents } = await joinRoom(io, socket, room);
      if (typeof ack === "function") {
        ack({ success: true, ...snapshot });
      }

      // См. комментарий в joinRoom: рассылаем ТОЛЬКО после ack, чтобы
      // клиент успел применить историю раньше, чем получит живое
      // "Добро пожаловать"/"переходит" — иначе оно было бы стёрто
      // безусловным setMessages(result.messages) в обработчике ack.
      for (const { scopeRoom, payload: eventPayload } of systemEvents) {
        broadcastSystemEvent(io, scopeRoom, eventPayload);
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

    const rateLimit = checkRateLimit(socket);
    if (rateLimit.limited) {
      return respond({
        success: false,
        code: "RATE_LIMITED",
        message: "Too many messages",
        details: { retryAfterMs: rateLimit.retryAfterMs },
      });
    }

    const room = socket.data.currentRoom || DEFAULT_ROOM;
    const text = typeof payload === "string" ? payload : payload?.text;

    try {
      const message = await MessageService.sendMessage({
        authorId: socket.data.userId,
        authorLogin: socket.data.login,
        authorColor: socket.data.color,
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
        // retryAfterMs присутствует только для MutedException (см.
        // exceptions/chat.exceptions.js) — фронтенду нужен именно он,
        // чтобы показать живой обратный отсчёт до конца мута.
        ...(err.details ? { details: err.details } : {}),
      });
    }
  });

  socket.on("disconnect", () => {
    const room = socket.data.currentRoom;
    if (!room) return;

    RoomPresence.leave(room, socket.id);
    broadcastRoomUsers(io, room);
    broadcastRoomsState(io);

    // "Покидает чат" — видят те, кто остался в комнате, где пользователь
    // был перед дисконнектом (сам уходящий уже отключился и это не увидит).
    broadcastSystemEvent(io, room, {
      event: "leave",
      login: socket.data.login,
      color: socket.data.color,
      room,
    });
  });
}