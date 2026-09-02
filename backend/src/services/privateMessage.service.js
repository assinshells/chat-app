import { PrivateMessageRepository } from "../repositories/privateMessage.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import {
  toPrivateMessageDto,
  toConversationSummaryDto,
} from "../dto/privateMessage.dto.js";
import { PrivateMessageValidationException } from "../exceptions/chat.exceptions.js";
import { DM_ERRORS, DM_LIMITS } from "../constants/chat.constants.js";

// Той самий принцип, що й у message.service.js: сервер ніколи не довіряє
// клієнтській нормалізації тексту, навіть якщо запит йде повз звичайний UI.
const normalizeText = (value) =>
  String(value ?? "")
    .replace(/[\r\n\u2028\u2029]+/g, " ")
    .trim();

export const PrivateMessageService = {
  /**
   * sendPrivateMessage — резолвить одержувача за логіном (клієнт не знає
   * і не повинен знати чужі user id), валідує текст, забороняє
   * писати самому собі, зберігає і повертає готовий DTO.
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
   * getConversation — історія листування з конкретним співрозмовником
   * (за логіном). otherLogin не знайдено -> порожня історія (не помилка:
   * діалогу з неіснуючим/ще не відкритим користувачем просто немає).
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
   * listConversations — зведення по всіх діалогах користувача (для
   * вертикальних вкладок у DirectMessagesModal), останні активні —
   * першими.
   */
  async listConversations({ userId }) {
    const rows = await PrivateMessageRepository.findConversationsList(userId);
    return rows.map(toConversationSummaryDto);
  },
};
