import { SOCKET_EVENTS, dmChannel } from "../constants/chat.constants.js";
import { RoomPresence } from "./presence.js";
import { broadcastRoomUsers, broadcastRoomsState } from "./broadcast.js";
import { MessageService } from "../services/message.service.js";

/**
 * moderationEnforcement — застосовує кік/бан ПРЯМО ЗАРАЗ до вже
 * підключених сокетів жертви (без цього кік/бан подіяв би лише
 * "заднім числом", на наступному room:join/message:send жертви — див.
 * коментарі в chat.socket.js). Викликається із
 * services/moderationAction.service.js одразу після запису дії в БД.
 *
 * io.in(dmChannel(userId)) — той самий персональний канал, до якого
 * кожен сокет автоматично приєднується при connect для доставки DM
 * (sockets/dm.socket.js) і НІКОЛИ не покидає незалежно від поточної
 * публічної кімнати — тому це готовий, вже існуючий спосіб дістатися
 * до ВСІХ вкладок/пристроїв конкретного userId, не тримаючи власного
 * реєстру socketId по userId.
 *
 * fetchSockets() у застосунку без Socket.IO adapter (Redis adapter
 * тощо, а тут його немає — один backend-інстанс, як і скрізь у
 * проєкті) повертає реальні локальні Socket-інстанси, тому їхні
 * .leave()/.data/.emit() працюють як завжди — це НЕ RemoteSocket
 * урізаний API з кластерного сценарію.
 */

/**
 * forceLeaveRoom — виштовхує userId з КОНКРЕТНОЇ room на всіх його
 * сокетах: і з Socket.IO room, і з presence-реєстру, обнуляє
 * currentRoom (щоб message:send одразу відмовляв, а не летів у
 * DEFAULT_ROOM — див. коментар у chat.socket.js), сповіщає жертву
 * подією MODERATION_KICKED/MODERATION_BANNED і лише ОДИН раз
 * розсилає оновлений склад кімнати решті.
 */
export async function forceLeaveRoom(io, userId, room, { event, ...notifyPayload }) {
  const sockets = await io.in(dmChannel(userId)).fetchSockets();
  const affected = sockets.filter((s) => s.rooms.has(room));
  if (affected.length === 0) return;

  for (const s of affected) {
    s.leave(room);
    RoomPresence.leave(room, s.id);
    s.data.currentRoom = null;
    s.emit(event, { room, ...notifyPayload });
  }

  broadcastRoomUsers(io, room);
  broadcastRoomsState(io);
}

/**
 * forceDisconnectUser — глобальний бан: жертва не просто виходить з
 * поточної кімнати, а розриває з'єднання повністю (клієнт покаже
 * окремий екран "доступ обмежено" і не намагатиметься одразу
 * реконектитись у чат, див. фронтенд useChatSocket). Невелика
 * затримка перед disconnectSockets — щоб emit з причиною встиг
 * долетіти до клієнта раніше за сам розрив з'єднання.
 */
export async function forceDisconnectUser(io, userId, { event, ...notifyPayload }) {
  const sockets = await io.in(dmChannel(userId)).fetchSockets();
  if (sockets.length === 0) return;

  let affectedAnyRoom = false;
  for (const s of sockets) {
    if (s.data.currentRoom) {
      RoomPresence.leave(s.data.currentRoom, s.id);
      affectedAnyRoom = true;
    }
    s.data.currentRoom = null;
    s.emit(event, notifyPayload);
  }

  if (affectedAnyRoom) broadcastRoomsState(io);

  setTimeout(() => {
    io.in(dmChannel(userId)).disconnectSockets(true);
  }, 300);
}

export const ModerationEvents = {
  KICKED: SOCKET_EVENTS.MODERATION_KICKED,
  BANNED: SOCKET_EVENTS.MODERATION_BANNED,
};

/**
 * enforceKickConfinement — на відміну від forceLeaveRoom (просто
 * виштовхує і лишає "без кімнати"), кік ПЕРЕВОДИТЬ усі сокети жертви
 * в confinedRoom (KICK_CONFINEMENT_ROOM, зазвичай лише один — bespredel)
 * ОДРАЗУ Ж, а не лише блокує повернення в sourceRoom: інакше клієнту
 * довелося б самому здогадуватися, куди його "кинули", окремим
 * room:join з гонкою станів. Тут сервер сам:
 *  1) виводить кожен сокет із кімнати, де він фактично сидів (яка може
 *     відрізнятися від sourceRoom — наприклад, у іншій вкладці);
 *  2) заводить його в confinedRoom (і Socket.IO room, і presence);
 *  3) один раз віддає СПІЛЬНИЙ знімок confinedRoom (історія+учасники)
 *     усім її постраждалим сокетам одразу в самій події —
 *     MODERATION_KICKED, а не окремим наступним room:join.
 *
 * Room-check у room:join (chat.socket.js) все одно лишається головним
 * захистом (працює і для сокетів, що були офлайн у момент кіку) — це
 * лише миттєве застосування для вже підключених.
 */
export async function enforceKickConfinement(io, userId, { sourceRoom, confinedRoom, reason, expiresAt }) {
  const sockets = await io.in(dmChannel(userId)).fetchSockets();
  if (sockets.length === 0) return;

  const vacatedRooms = new Set();

  for (const s of sockets) {
    const prevRoom = s.data.currentRoom;
    if (prevRoom && prevRoom !== confinedRoom) {
      s.leave(prevRoom);
      RoomPresence.leave(prevRoom, s.id);
      vacatedRooms.add(prevRoom);
    }

    if (prevRoom !== confinedRoom) {
      s.join(confinedRoom);
      RoomPresence.join(confinedRoom, s.id, {
        id: s.data.userId,
        login: s.data.login,
        gender: s.data.gender,
        color: s.data.color,
      });
    }

    s.data.currentRoom = confinedRoom;
  }

  const messages = await MessageService.getHistory({ room: confinedRoom });
  const snapshot = {
    room: confinedRoom,
    messages,
    users: RoomPresence.listUsers(confinedRoom),
    count: RoomPresence.countUsers(confinedRoom),
  };

  for (const s of sockets) {
    s.emit(ModerationEvents.KICKED, { sourceRoom, confinedRoom, reason, expiresAt, snapshot });
  }

  for (const room of vacatedRooms) {
    broadcastRoomUsers(io, room);
  }
  broadcastRoomUsers(io, confinedRoom);
  broadcastRoomsState(io);
}
