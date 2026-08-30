import { PrivateMessageRepository } from "../repositories/privateMessage.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import {
  toPrivateMessageDto,
  toConversationSummaryDto,
} from "../dto/privateMessage.dto.js";
import { PrivateMessageValidationException } from "../exceptions/chat.exceptions.js";
import { DM_ERRORS, DM_LIMITS } from "../constants/chat.constants.js";

// Тот же принцип, что и в message.service.js: сервер никогда не доверяет
// клиентской нормализации текста, даже если запрос идёт мимо обычного UI.
const normalizeText = (value) =>
  String(value ?? "")
    .replace(/[\r\n\u2028\u2029]+/g, " ")
    .trim();

export const PrivateMessageService = {
  /**
   * sendPrivateMessage — резолвит получателя по логину (клиент не знает
   * и не должен знать чужие user id), валидирует текст, запрещает
   * писать самому себе, сохраняет и возвращает готовый DTO.
   */
  async sendPrivateMessage({ senderId, senderLogin, recipientLogin, text }) {
    const normalized = normalizeText(text);

    if (!normalized) {
      throw new PrivateMessageValidationException(DM_ERRORS.MESSAGE_EMPTY);
    }
    if (normalized.length > DM_LIMITS.MAX_MESSAGE_LENGTH) {
      throw new PrivateMessageValidationException(DM_ERRORS.MESSAGE_TOO_LONG);
    }
    if (recipientLogin === senderLogin) {
      throw new PrivateMessageValidationException(DM_ERRORS.CANNOT_MESSAGE_SELF);
    }

    const recipient = await UserRepository.findByLogin(recipientLogin);
    if (!recipient) {
      throw new PrivateMessageValidationException(DM_ERRORS.RECIPIENT_NOT_FOUND);
    }

    const created = await PrivateMessageRepository.create({
      senderId,
      recipientId: recipient.id,
      text: normalized,
    });

    return {
      message: toPrivateMessageDto({
        ...created,
        sender_login: senderLogin,
        recipient_login: recipient.login,
      }),
      recipientId: recipient.id,
    };
  },

  /**
   * getConversation — история переписки с конкретным собеседником
   * (по логину). otherLogin не найден -> пустая история (не ошибка:
   * диалога с несуществующим/ещё не открытым пользователем просто нет).
   */
  async getConversation({
    userId,
    otherLogin,
    limit = DM_LIMITS.HISTORY_DEFAULT_LIMIT,
  }) {
    const other = await UserRepository.findByLogin(otherLogin);
    if (!other) return [];

    const safeLimit = Math.min(
      Math.max(1, Number(limit) || DM_LIMITS.HISTORY_DEFAULT_LIMIT),
      DM_LIMITS.HISTORY_MAX_LIMIT,
    );

    const rows = await PrivateMessageRepository.findConversation(
      userId,
      other.id,
      safeLimit,
    );
    return rows.map(toPrivateMessageDto);
  },

  /**
   * listConversations — сводка по всем диалогам пользователя (для
   * вертикальных вкладок в DirectMessagesModal), последние активные —
   * первыми.
   */
  async listConversations({ userId }) {
    const rows = await PrivateMessageRepository.findConversationsList(userId);
    return rows.map(toConversationSummaryDto);
  },
};
