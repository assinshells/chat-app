import { MessageRepository } from "../repositories/message.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { toMessageDto } from "../dto/message.dto.js";
import { MessageValidationException } from "../exceptions/chat.exceptions.js";
import { ModerationService } from "../moderation/moderation.service.js";
import {
  CHAT_ERRORS,
  CHAT_LIMITS,
  DEFAULT_ROOM,
  isValidRoom,
} from "../constants/chat.constants.js";

// Будь-які переноси рядків (у т.ч. вставлений багаторядковий текст)
// згортаються в пробіл — сервер ніколи не довіряє клієнтській нормалізації,
// інакше прямий запит у socket в обхід UI міг би протягнути перенесення рядка.
const normalizeText = (value) =>
  String(value ?? "")
    .replace(/[\r\n\u2028\u2029]+/g, " ")
    .trim();

export const MessageService = {
  /**
   * sendMessage — валідує і зберігає повідомлення від authorId, повертає
   * готовий до розсилки DTO (без зайвого походу в БД за login — він вже
   * відомий з автентифікованої сесії відправника). Невідома room тихо
   * замінюється на DEFAULT_ROOM — кімнати фіксовані списком на бекенді,
   * клієнт не може завести довільну.
   */
  async sendMessage({ authorId, authorLogin, authorColor, text, room = DEFAULT_ROOM }) {
    // Мут перевіряється раніше за нормалізацію тексту: замученому
    // користувачу не потрібне пояснення про порожнє/довге повідомлення —
    // йому потрібен лише код MUTED із часом, що залишився.
    ModerationService.assertNotMuted(authorId);

    const normalized = normalizeText(text);

    if (!normalized) {
      throw new MessageValidationException(CHAT_ERRORS.MESSAGE_EMPTY);
    }
    if (normalized.length > CHAT_LIMITS.MAX_MESSAGE_LENGTH) {
      throw new MessageValidationException(CHAT_ERRORS.MESSAGE_TOO_LONG);
    }

    // Автомодератор: мат / КАПС / спам-повтор / спам-посилання (див.
    // moderation/moderation.service.js). Кидає виняток із кодом
    // конкретної причини — повідомлення до збереження/розсилки не
    // доходить. Накопичення порушень може тут же ввімкнути тимчасовий
    // мут для наступних повідомлень цього користувача.
    ModerationService.check({ userId: authorId, text: normalized });

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