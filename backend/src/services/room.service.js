import { CHAT_ROOMS, findRoomById } from "../constants/rooms.data.js";
import { RoomNotFoundException } from "../exceptions/chat.exceptions.js";
import { toRoomResponseDto } from "../dto/chat.dto.js";

/**
 * RoomService — комнаты статические (см. constants/rooms.data.js),
 * поэтому весь сервис синхронный: ни БД, ни сети. Тем не менее методы
 * вызываются с await из MessageService/сокетов на случай, если список
 * когда-нибудь снова переедет в БД — await на не-промисе безвреден.
 */
export const RoomService = {
  listRooms() {
    return CHAT_ROOMS.map(toRoomResponseDto);
  },

  /**
   * Общая проверка "комната существует", нужна и REST-истории, и
   * REST/Socket.IO отправке сообщения, и join-хендлеру сокета —
   * вынесена сюда один раз вместо дублирования поиска+throw в
   * каждом месте.
   */
  assertRoomExists(roomId) {
    const room = findRoomById(roomId);
    if (!room) throw new RoomNotFoundException();
    return room;
  },
};
