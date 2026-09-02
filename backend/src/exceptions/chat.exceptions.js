import { BaseException } from "./base.exception.js";
import { HTTP_STATUS } from "../constants/auth.constants.js";
import { CHAT_ERRORS, DM_ERRORS } from "../constants/chat.constants.js";

export class MessageValidationException extends BaseException {
  constructor(message = CHAT_ERRORS.MESSAGE_EMPTY) {
    super(message, HTTP_STATUS.BAD_REQUEST, "MESSAGE_VALIDATION_FAILED");
  }
}

export class PrivateMessageValidationException extends BaseException {
  constructor(message = DM_ERRORS.MESSAGE_EMPTY) {
    super(message, HTTP_STATUS.BAD_REQUEST, "PRIVATE_MESSAGE_VALIDATION_FAILED");
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