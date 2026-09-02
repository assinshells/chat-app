import { ROOM_IDS } from "../constants/chat.constants.js";

/**
 * RoomPresence — in-memory реєстр "хто онлайн і в якій кімнаті".
 *
 * Зберігає room -> Map<socketId, {id, login, gender}>. Ключ Map — саме
 * socketId (а не userId), оскільки один користувач потенційно може
 * відкрити декілька вкладок/пристроїв — кожне своє socket-з'єднання
 * має незалежно обліковуватися і коректно прибиратися при disconnect
 * саме цієї вкладки, не чіпаючи presence інших.
 *
 * Реєстр попередньо заповнений порожніми Map для УСІХ відомих кімнат
 * (ROOM_IDS) і запис про кімнату ніколи не видаляється, навіть коли
 * вона порожніє — список кімнат скінченний і фіксований (30 штук),
 * витоків пам'яті це не створює, зате countsByRoom() завжди явно
 * повертає 0 для спорожнілої кімнати. Якщо видаляти запис при
 * спорожнінні, rooms:state мовчки перестає згадувати цю кімнату
 * (замість count: 0), і клієнт, який щойно сам вийшов з неї (і тому
 * не перебуває в її Socket.IO room, щоб отримати прицільний
 * room:users), продовжує показувати застарілий ненульовий лічильник,
 * злитий через {...prev, ...counts} з відсутнім ключем — це і була
 * причина "лічильник не очищається при переході".
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

  /** countsByRoom — знімок {roomId: count} по УСІХ відомих кімнатах, включно з порожніми (count: 0). */
  countsByRoom() {
    const result = {};
    for (const [room, map] of roomUsers.entries()) {
      result[room] = map.size;
    }
    return result;
  },
};
