import { PrivateMessageRepository } from "../repositories/privateMessage.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { BlockRepository } from "../repositories/block.repository.js";
import {
  toPrivateMessageDto,
  toConversationSummaryDto,
} from "../dto/privateMessage.dto.js";
import {
  PrivateMessageValidationException,
  PrivateMessageBlockedException,
} from "../exceptions/chat.exceptions.js";
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

    // Блокування діє в ОБИДВА боки на рівні заборони відправлення:
    // не лише "заблокований не може писати блокувальнику" (буквальна
    // вимога), а й "блокувальник не може писати заблокованому" — той
    // все одно зник з його списку користувачів на фронтенді, тож і
    // спроба написати йому напряму (наприклад, зі старого відкритого
    // діалогу) так само відхиляється, без потреби в окремому коді
    // помилки для кожного напрямку.
    const isBlocked = await BlockRepository.isBlockedEitherWay(senderId, recipient.id);
    if (isBlocked) {
      throw new PrivateMessageBlockedException();
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
    if (!other) return { messages: [], blocked: false };

    const safeLimit = Math.min(
      Math.max(1, Number(limit) || DM_LIMITS.HISTORY_DEFAULT_LIMIT),
      DM_LIMITS.HISTORY_MAX_LIMIT,
    );

    const [rows, blocked] = await Promise.all([
      PrivateMessageRepository.findConversation(userId, other.id, safeLimit),
      // Обидва напрямки в одному прапорці: фронту для рішення
      // "показати діалог з вимкненою формою" чи "не відкривати діалог
      // узагалі" (див. DmTriggerButton/useDmStore) не важливо, ХТО саме
      // кого заблокував — форма відправлення в будь-якому разі
      // недоступна (сервер однаково відхилить dm:send, див. sendPrivateMessage).
      BlockRepository.isBlockedEitherWay(userId, other.id),
    ]);

    // Відкрили історію — значить побачили все, що там є. Не блокуємо
    // відповідь: клієнту історія потрібна одразу, позначку "прочитано"
    // він не чекає (немає ack-поля, яке б на неї реагувало).
    PrivateMessageRepository.markConversationAsRead(userId, other.id).catch(() => {});

    return { messages: rows.map(toPrivateMessageDto), blocked };
  },

  /**
   * markConversationAsRead — явне позначення діалогу прочитаним без
   * перезапиту історії (dm:read, див. dm.socket.js): потрібно, коли
   * діалог УЖЕ відкритий і нове повідомлення прийшло live через dm:new —
   * dm:open для нього вдруге не викликається (клієнт кешує loaded),
   * тож без цього окремого шляху read_at так і лишався б NULL, і при
   * наступному вході (інша вкладка/relogin) те саме повідомлення
   * показалося б непрочитаним, хоч людина його вже бачила.
   */
  async markConversationAsRead({ userId, otherLogin }) {
    const other = await UserRepository.findByLogin(otherLogin);
    if (!other) return;
    await PrivateMessageRepository.markConversationAsRead(userId, other.id);
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
