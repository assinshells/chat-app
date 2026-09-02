import { normalizeForModeration } from "./textNormalize.js";
import { moderationConfig } from "../config/moderation.config.js";

const URL_PATTERN = /\bhttps?:\/\/\S+|\bwww\.\S+/gi;

/**
 * countLinks — груба оцінка "це повідомлення — по суті самі
 * посилання?": рахує збіги URL_PATTERN і порівнює сумарну довжину
 * посилань з довжиною всього тексту. Одне-два повідомлення з
 * посиланням у діалозі — це нормально, а от "дивись тут http://...
 * http://... http://..." — типовий рекламний спам.
 */
function isLinkFlood(text) {
  const matches = String(text ?? "").match(URL_PATTERN) ?? [];
  if (matches.length < moderationConfig.spam.maxLinksPerMessage) return false;

  const linksLength = matches.reduce((sum, url) => sum + url.length, 0);
  return linksLength / Math.max(String(text ?? "").length, 1) > 0.5;
}

/**
 * isDuplicateFlood — true, якщо ОСТАННІ duplicateMaxRepeats-1
 * повідомлень цього користувача (в межах duplicateWindowMs) після
 * нормалізації збігаються з поточним — тобто поточне було б
 * duplicateMaxRepeats-м повтором поспіль без жодного іншого
 * повідомлення між ними.
 *
 * state.recent — масив { text, ts }, який веде і поповнює
 * ModerationService (див. moderation.service.js); ця функція сама
 * нічого не мутує, лише читає.
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
   * check — повертає { isSpam, reason } замість простого boolean:
   * reason ("duplicate" | "links") йде в код помилки, який бачить
   * клієнт (SPAM_DUPLICATE / SPAM_LINKS у chat.constants.js), щоб
   * підказка користувачу була осмисленою, а не загальним "це спам".
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
