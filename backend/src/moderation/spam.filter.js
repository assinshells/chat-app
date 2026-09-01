import { normalizeForModeration } from "./textNormalize.js";
import { moderationConfig } from "../config/moderation.config.js";

const URL_PATTERN = /\bhttps?:\/\/\S+|\bwww\.\S+/gi;

/**
 * countLinks — грубая оценка "это сообщение — по сути одни ссылки?":
 * считает совпадения URL_PATTERN и сравнивает суммарную длину ссылок с
 * длиной всего текста. Одно-два сообщения со ссылкой в диалоге — это
 * нормально, а вот "смотри тут http://... http://... http://..." —
 * типичный рекламный спам.
 */
function isLinkFlood(text) {
  const matches = String(text ?? "").match(URL_PATTERN) ?? [];
  if (matches.length < moderationConfig.spam.maxLinksPerMessage) return false;

  const linksLength = matches.reduce((sum, url) => sum + url.length, 0);
  return linksLength / Math.max(String(text ?? "").length, 1) > 0.5;
}

/**
 * isDuplicateFlood — true, если ПОСЛЕДНИЕ duplicateMaxRepeats-1
 * сообщений этого пользователя (в пределах duplicateWindowMs) после
 * нормализации совпадают с текущим — то есть текущее было бы
 * duplicateMaxRepeats-м повтором подряд без единого другого сообщения
 * между ними.
 *
 * state.recent — массив { text, ts }, который ведёт и пополняет
 * ModerationService (см. moderation.service.js); эта функция сама
 * ничего не мутирует, только читает.
 */
function isDuplicateFlood(state, text, now) {
  const normalized = normalizeForModeration(text);
  if (!normalized) return false;

  const windowStart = now - moderationConfig.spam.duplicateWindowMs;
  const recentInWindow = state.recent.filter((item) => item.ts >= windowStart);

  const requiredStreak = moderationConfig.spam.duplicateMaxRepeats - 1;
  if (recentInWindow.length < requiredStreak) return false;

  const lastN = recentInWindow.slice(-requiredStreak);
  return lastN.every((item) => normalizeForModeration(item.text) === normalized);
}

export const spamFilter = {
  /**
   * check — возвращает { isSpam, reason } вместо простого boolean:
   * reason ("duplicate" | "links") уходит в код ошибки, который видит
   * клиент (SPAM_DUPLICATE / SPAM_LINKS в chat.constants.js), чтобы
   * подсказка пользователю была осмысленной, а не общим "это спам".
   */
  check(state, text, now) {
    if (isLinkFlood(text)) {
      return { isSpam: true, reason: "links" };
    }
    if (isDuplicateFlood(state, text, now)) {
      return { isSpam: true, reason: "duplicate" };
    }
    return { isSpam: false, reason: null };
  },
};
