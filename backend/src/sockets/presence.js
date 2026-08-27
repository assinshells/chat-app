import { ROOM_IDS } from "../constants/chat.constants.js";

/**
 * RoomPresence — in-memory реестр "кто онлайн в какой комнате".
 *
 * Хранит room -> Map<socketId, {id, login, gender}>. Ключ Map — именно
 * socketId (а не userId), т.к. один пользователь потенциально может
 * открыть несколько вкладок/устройств — каждое своё socket-соединение
 * должно независимо учитываться и корректно убираться при disconnect
 * именно этой вкладки, не трогая presence остальных.
 *
 * Реестр предзаполнен пустыми Map для ВСЕХ известных комнат (ROOM_IDS) и
 * запись о комнате никогда не удаляется, даже когда она пустеет — список
 * комнат конечный и фиксированный (30 штук), утечки памяти это не создаёт,
 * зато countsByRoom() всегда явно возвращает 0 для опустевшей комнаты.
 * Если удалять запись при опустении, rooms:state молча перестаёт
 * упоминать эту комнату (вместо count: 0), и клиент, который только что
 * сам вышел из неё (и потому не состоит в её Socket.IO room, чтобы
 * получить прицельный room:users), продолжает показывать устаревший
 * ненулевой счётчик, слитый через {...prev, ...counts} с отсутствующим
 * ключом — это и была причина "счётчик не очищается при переходе".
 */
const roomUsers = new Map(ROOM_IDS.map((id) => [id, new Map()]));

function getRoomMap(room) {
  if (!roomUsers.has(room)) {
    roomUsers.set(room, new Map());
  }
  return roomUsers.get(room);
}

export const RoomPresence = {
  join(room, socketId, user) {
    getRoomMap(room).set(socketId, user);
  },

  leave(room, socketId) {
    const map = roomUsers.get(room);
    if (!map) return;

    map.delete(socketId);
  },

  listUsers(room) {
    const map = roomUsers.get(room);
    return map ? Array.from(map.values()) : [];
  },

  countUsers(room) {
    const map = roomUsers.get(room);
    return map ? map.size : 0;
  },

  /** countsByRoom — снапшот {roomId: count} по ВСЕМ известным комнатам, включая пустые (count: 0). */
  countsByRoom() {
    const result = {};
    for (const [room, map] of roomUsers.entries()) {
      result[room] = map.size;
    }
    return result;
  },
};