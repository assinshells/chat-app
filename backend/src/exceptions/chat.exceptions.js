import { BaseException } from "./base.exception.js";
import { HTTP_STATUS } from "../constants/auth.constants.js";
import { CHAT_ERRORS, DM_ERRORS, BLOCK_ERRORS } from "../constants/chat.constants.js";

export class MessageValidationException extends BaseException {
  constructor(message = CHAT_ERRORS.MESSAGE_EMPTY) {
    super(message, HTTP_STATUS.BAD_REQUEST, "MESSAGE_VALIDATION_FAILED");
  }
}

export class PrivateMessageValidationException extends BaseException {
  constructor(message = DM_ERRORS.MESSAGE_EMPTY, code = "PRIVATE_MESSAGE_VALIDATION_FAILED") {
    super(message, HTTP_STATUS.BAD_REQUEST, code);
  }
}

/**
 * PrivateMessageBlockedException — окремий (від звичайної валідації)
 * виняток для випадку "відправлення заборонене через блокування" (див.
 * services/privateMessage.service.js: перевіряється в обидва боки —
 * відправник заблокував одержувача або одержувач заблокував
 * відправника). Власний code ("PRIVATE_MESSAGE_BLOCKED"), щоб фронтенд
 * міг відрізнити цю відмову від, наприклад, порожнього тексту.
 */
export class PrivateMessageBlockedException extends BaseException {
  constructor(message = DM_ERRORS.BLOCKED) {
    super(message, HTTP_STATUS.FORBIDDEN, "PRIVATE_MESSAGE_BLOCKED");
  }
}

/**
 * BlockValidationException — помилки самої дії (не)блокування
 * (block:add/block:remove, див. services/block.service.js) —
 * самоблокування, неіснуючий користувач, повторна (не)дія тощо.
 */
export class BlockValidationException extends BaseException {
  constructor(message = BLOCK_ERRORS.USER_NOT_FOUND) {
    super(message, HTTP_STATUS.BAD_REQUEST, "BLOCK_VALIDATION_FAILED");
  }
}

/**
 * Винятки автомодератора (див. moderation/moderation.service.js).
 * Кожен несе свій `code`, за яким фронтенд підбирає конкретну
 * підказку користувачу (див. shared/lib/moderationMessages.js) замість
 * загального "не вдалося надіслати повідомлення".
 */
export class ProfanityException extends BaseException {
  constructor(message = CHAT_ERRORS.PROFANITY) {
    super(message, HTTP_STATUS.BAD_REQUEST, "PROFANITY_DETECTED");
  }
}

export class CapsLockException extends BaseException {
  constructor(message = CHAT_ERRORS.CAPS_LOCK) {
    super(message, HTTP_STATUS.BAD_REQUEST, "CAPS_LOCK_DETECTED");
  }
}

export class SpamException extends BaseException {
  /**
   * @param {"duplicate"|"links"} reason
   */
  constructor(reason = "duplicate", message = CHAT_ERRORS.SPAM[reason] ?? CHAT_ERRORS.SPAM.duplicate) {
    super(message, HTTP_STATUS.BAD_REQUEST, reason === "links" ? "SPAM_LINKS_DETECTED" : "SPAM_DUPLICATE_DETECTED");
  }
}

export class MutedException extends BaseException {
  /**
   * @param {number} retryAfterMs - через скільки мс мут знімається
   */
  constructor(retryAfterMs, message = CHAT_ERRORS.MUTED) {
    super(message, HTTP_STATUS.TOO_MANY, "MUTED");
    this.retryAfterMs = retryAfterMs;
    this.details = { retryAfterMs };
  }
}

/**
 * BannedException — на відміну від MutedException (тимчасова
 * автоматична кара за спам/мат), кидається при активному РУЧНОМУ бані
 * (див. services/moderationAction.service.js, sockets/chat.socket.js).
 * expiresAt: null означає бан назавжди.
 */
export class BannedException extends BaseException {
  constructor({ scope, room, reason, expiresAt }) {
    super(
      scope === "global"
        ? "Вас заблоковано в чаті"
        : "Вас заблоковано в цій кімнаті",
      HTTP_STATUS.FORBIDDEN,
      "BANNED",
    );
    this.details = { scope, room, reason: reason ?? null, expiresAt: expiresAt ?? null };
  }
}

/**
 * ConfinedException — кидається при спробі перейти в БУДЬ-ЯКУ кімнату,
 * ОКРІМ confinedRoom, поки діє кік-обмеження (room_confinements, див.
 * repositories/confinement.repository.js). На відміну від BannedException
 * (не можна ЗАЙТИ в конкретну кімнату), тут навпаки: не можна вийти з
 * ОДНІЄЇ конкретної (confinedRoom) — обмеження завжди тимчасове
 * (expiresAt не буває null, кік не видається "назавжди").
 */
export class ConfinedException extends BaseException {
  constructor({ confinedRoom, reason, expiresAt }) {
    super("Ви тимчасово обмежені однією кімнатою", HTTP_STATUS.FORBIDDEN, "CONFINED");
    this.details = { confinedRoom, reason: reason ?? null, expiresAt };
  }
}