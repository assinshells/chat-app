import { MessageService } from "../services/message.service.js";
import { DEFAULT_ROOM, SOCKET_EVENTS, isValidRoom } from "../constants/chat.constants.js";
import { RoomPresence } from "./presence.js";
import logger from "../config/logger.js";

// Проста in-memory-защита від флуду: не більше N повідомлень за
// ковзне вікно на сокет-з'єднання. Для одного backend-інстансу цього
// достатньо; при горизонтальному масштабуванні варто перенести в
// Redis (за аналогією з лімітами OTP), але поки що це не потрібно.
const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX_MESSAGES = 20;

/**
 * checkRateLimit — повертає { limited: false } або { limited: true,
 * retryAfterMs }. retryAfterMs — скільки чекати до моменту, коли
 * найстаріше повідомлення у вікні "застаріє" і звільнить слот (вікно
 * ковзне, а не фіксоване, тому це не просто "секунда до кінця вікна",
 * а точний час до наступного дозволеного слота). Раніше функція
 * повертала просто boolean — фронтенду не було б чим показати зворотний
 * відлік до кінця ліміту без цього числа.
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
 * broadcastSystemEvent — розсилає системне повідомлення (вхід/перехід/
 * вихід) учасникам КОНКРЕТНОЇ Socket.IO room через io.to(scopeRoom) —
 * не глобально. scopeRoom — це КОМУ видно ефект (хто повинен побачити
 * рядок у своїй стрічці), а payload.room — це НАЗВА кімнати, згадана в
 * тексті повідомлення; для події 'switch' вони РІЗНІ: розсилається в
 * СТАРУ кімнату (scopeRoom), а текст називає НОВУ (payload.room), див.
 * joinRoom нижче. Текст повідомлення не залежить від статі користувача
 * (див. widgets/chat-conversation) — gender сюди свідомо не передається.
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
 * joinRoom — переводить socket з поточної кімнати (якщо є) у цільову:
 * оновлює і Socket.IO room (потрібна для розсилки message:new лише
 * учасникам кімнати), і presence-реєстр (потрібен для підрахунку "хто
 * онлайн"), потім повертає знімок (історія повідомлень + учасники) —
 * це єдина відповідь на room:join, другий окремий запит історії не потрібен.
 *
 * Системні події (вхід/перехід) НЕ розсилаються звідси напряму —
 * функція лише ЗБИРАЄ їх у systemEvents і повертає викликаючому
 * коду (див. SOCKET_EVENTS.ROOM_JOIN нижче), щоб той розіслав їх уже
 * ПІСЛЯ відправлення ack з історією. Це важливо: якщо розіслати їх
 * раніше за ack, клієнт отримає live-подію "Ласкаво просимо" раніше,
 * ніж ack зі знімком історії, а обробник ack безумовно робить
 * setMessages(result.messages) — це стерло б уже відмальоване
 * системне повідомлення (гонка станів, через яку воно "блимало" і
 * зникало).
 */
async function joinRoom(io, socket, requestedRoom) {
  const targetRoom = isValidRoom(requestedRoom) ? requestedRoom : DEFAULT_ROOM;
  const previousRoom = socket.data.currentRoom;
  const systemEvents = [];

  if (previousRoom !== targetRoom) {
    if (previousRoom) {
      socket.leave(previousRoom);
      RoomPresence.leave(previousRoom, socket.id);
      // Сам сокет, що йде, уже не перебуває в Socket.IO room previousRoom
      // (socket.leave вище), тому цей emit до нього не долетить — якщо
      // він був останнім у кімнаті, отримувачів у події взагалі 0, і
      // це нормально: актуальний (у т.ч. нульовий) лічильник тому, хто
      // йде, доставить broadcastRoomsState(io) нижче — той завжди явно
      // включає count: 0 для спорожнілої кімнати (див. presence.js).
      broadcastRoomUsers(io, previousRoom);

      // "Переходить у кімнату X" — бачать ЛИШЕ ті, хто залишився в
      // СТАРІЙ кімнаті (scopeRoom = previousRoom); сам той, хто переходить,
      // цього вже не побачить (він вийшов з previousRoom рядком вище) —
      // і це правильно, йому за мить прийде своє "Ласкаво просимо" в нову.
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

    // "Ласкаво просимо до чату" — бачать УСІ, хто зараз у цільовій
    // кімнаті (включно з самим тим, хто увійшов, він вже participant
    // targetRoom після socket.join вище), незалежно від того, перший
    // це вхід за сесію чи перехід з іншої кімнати — повідомлення однакове.
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
  // Кімната за замовчуванням НЕ призначається автоматично — клієнт явно
  // запитує room:join одразу після connect (див. useChatSocket на
  // фронтенді). Так presence-реєстр завжди відображає реальний намір
  // клієнта, а не серверне припущення про те, в якій кімнаті він "повинен" бути.
  socket.on(SOCKET_EVENTS.ROOM_JOIN, async (payload, ack) => {
    const room = typeof payload === "string" ? payload : payload?.room;

    try {
      const { snapshot, systemEvents } = await joinRoom(io, socket, room);
      if (typeof ack === "function") {
        ack({ success: true, ...snapshot });
      }

      // Див. коментар у joinRoom: розсилаємо ЛИШЕ після ack, щоб
      // клієнт встиг застосувати історію раніше, ніж отримає живе
      // "Ласкаво просимо"/"переходить" — інакше воно було б стерто
      // безумовним setMessages(result.messages) в обробнику ack.
      for (const { scopeRoom, payload: eventPayload } of systemEvents) {
        broadcastSystemEvent(io, scopeRoom, eventPayload);
      }
    } catch (err) {
      logger.warn(
        `room:join не вдався для користувача ${socket.data.userId}: ${err.message}`,
      );
      if (typeof ack === "function") {
        ack({ success: false, message: "Не вдалося приєднатися до кімнати" });
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
        message: "Забагато повідомлень",
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

      // Розсилаємо в room, включно з самим відправником — єдине джерело
      // істини (серверний id/timestamp), без окремого оптимістичного
      // рендеру на клієнті, який потім довелося б звіряти/дедуплікувати.
      io.to(room).emit(SOCKET_EVENTS.MESSAGE_NEW, message);

      respond({ success: true });
    } catch (err) {
      logger.warn(
        `message:send відхилено для користувача ${socket.data.userId}: ${err.message}`,
      );
      respond({
        success: false,
        code: err.code ?? "MESSAGE_REJECTED",
        message: err.message,
        // retryAfterMs присутній лише для MutedException (див.
        // exceptions/chat.exceptions.js) — фронтенду потрібен саме він,
        // щоб показати живий зворотний відлік до кінця мута.
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

    // "Покидає чат" — бачать ті, хто залишився в кімнаті, де користувач
    // був перед дисконнектом (сам той, хто пішов, вже відключився і цього не побачить).
    broadcastSystemEvent(io, room, {
      event: "leave",
      login: socket.data.login,
      color: socket.data.color,
      room,
    });
  });
}
