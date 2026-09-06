import { SOCKET_EVENTS, dmChannel } from "../constants/chat.constants.js";
import { RoomPresence } from "./presence.js";
import { broadcastRoomUsers, broadcastRoomsState } from "./broadcast.js";

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
