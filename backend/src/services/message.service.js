import { MessageRepository } from "../repositories/message.repository.js";
import { RoomService } from "./room.service.js";
import { toMessageResponseDto } from "../dto/chat.dto.js";
import { CHAT_LIMITS } from "../constants/chat.constants.js";

export const MessageService = {
  async getHistory(roomId, { beforeId } = {}) {
    await RoomService.assertRoomExists(roomId);
    const rows = await MessageRepository.findByRoom(roomId, {
      limit: CHAT_LIMITS.HISTORY_PAGE_SIZE,
      beforeId,
    });
    return rows.map(toMessageResponseDto);
  },

  /**
   * Единая точка отправки сообщения — вызывается и Socket.IO-хендлером
   * (основной путь), поэтому вся бизнес-логика (проверка комнаты,
   * запись, формирование DTO) живёт здесь один раз, а не дублируется
   * между транспортами.
   */
  async sendMessage({ roomId, userId, content }) {
    await RoomService.assertRoomExists(roomId);
    const row = await MessageRepository.create({ roomId, userId, content });
    return toMessageResponseDto(row);
  },
};
