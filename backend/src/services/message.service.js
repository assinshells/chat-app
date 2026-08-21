import { MessageRepository } from "../repositories/message.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
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
  async sendMessage({ roomId, userId, content, recipientIds = [] }) {
    await RoomService.assertRoomExists(roomId);
    const resolvedRecipientIds = await MessageService._resolveRecipientIds(recipientIds, userId);
    const row = await MessageRepository.create({
      roomId,
      userId,
      content,
      recipientIds: resolvedRecipientIds,
    });
    return toMessageResponseDto(row);
  },

  /**
   * Чистит и проверяет recipientIds, пришедшие от клиента (клик по
   * никам в чате), прежде чем писать их в БД: убирает дубли и самого
   * отправителя (сам себе адресовать сообщение нельзя), режет до
   * MAX_RECIPIENTS и отбрасывает id, которых нет среди users — иначе
   * в message:new улетел бы "мёртвый" id без логина.
   * Порядок сохраняем как в исходном массиве — это порядок клика
   * пользователя, важен для отображения "Кому: A, B, C".
   */
  async _resolveRecipientIds(recipientIds, senderId) {
    const uniqueIds = [...new Set(recipientIds)]
      .filter((id) => id !== senderId)
      .slice(0, CHAT_LIMITS.MAX_RECIPIENTS);
    if (!uniqueIds.length) return [];

    const existingUsers = await UserRepository.findByIds(uniqueIds);
    const existingIds = new Set(existingUsers.map((u) => u.id));
    return uniqueIds.filter((id) => existingIds.has(id));
  },
};