import { MessageRepository } from "../repositories/message.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { toMessageDto } from "../dto/message.dto.js";
import { MessageValidationException } from "../exceptions/chat.exceptions.js";
import {
  CHAT_ERRORS,
  CHAT_LIMITS,
  DEFAULT_ROOM,
  isValidRoom,
} from "../constants/chat.constants.js";

// Любые переносы строк (в т.ч. вставленный многострочный текст) схлопываются
// в пробел — сервер никогда не доверяет клиентской нормализации, иначе
// прямой запрос в socket в обход UI мог бы протащить перенос строки.
const normalizeText = (value) =>
  String(value ?? "")
    .replace(/[\r\n\u2028\u2029]+/g, " ")
    .trim();

export const MessageService = {
  /**
   * sendMessage — валидирует и сохраняет сообщение от authorId, возвращает
   * готовый к рассылке DTO (без лишнего похода в БД за login — он уже
   * известен из аутентифицированной сессии отправителя). Неизвестный
   * room тихо заменяется на DEFAULT_ROOM — комнаты фиксированы списком
   * на бэкенде, клиент не может завести произвольную.
   */
  async sendMessage({ authorId, authorLogin, authorColor, text, room = DEFAULT_ROOM }) {
    const normalized = normalizeText(text);

    if (!normalized) {
      throw new MessageValidationException(CHAT_ERRORS.MESSAGE_EMPTY);
    }
    if (normalized.length > CHAT_LIMITS.MAX_MESSAGE_LENGTH) {
      throw new MessageValidationException(CHAT_ERRORS.MESSAGE_TOO_LONG);
    }

    const safeRoom = isValidRoom(room) ? room : DEFAULT_ROOM;

    const created = await MessageRepository.create({
      authorId,
      text: normalized,
      room: safeRoom,
    });

    return toMessageDto({ ...created, author: authorLogin, color: authorColor });
  },

  async getHistory({ room = DEFAULT_ROOM, limit = CHAT_LIMITS.HISTORY_DEFAULT_LIMIT } = {}) {
    const safeRoom = isValidRoom(room) ? room : DEFAULT_ROOM;
    const safeLimit = Math.min(
      Math.max(1, Number(limit) || CHAT_LIMITS.HISTORY_DEFAULT_LIMIT),
      CHAT_LIMITS.HISTORY_MAX_LIMIT,
    );

    const rows = await MessageRepository.findRecent(safeRoom, safeLimit);
    return rows.map(toMessageDto);
  },

  async resolveAuthorLogin(userId) {
    const user = await UserRepository.findById(userId);
    return user?.login ?? null;
  },
};