/**
 * Коды приходят от backend/src/sockets/chat.socket.js в ack
 * { success:false, code, message, details? } — см. exceptions/chat.exceptions.js
 * и moderation/moderation.service.js. Текст подсказок здесь, а не на
 * бэкенде: сервер отдаёт технический code + details (числа), а
 * человеческую формулировку на языке интерфейса подбирает клиент —
 * так бэкенд не привязан к конкретному языку UI.
 */
const SECOND = 1000;

function formatSeconds(ms) {
  return Math.max(1, Math.ceil(ms / SECOND));
}

/**
 * describeSendError — текст для chat-input-hint под полем ввода.
 * retryAfterMs (если есть) уже "живой" остаток на момент вызова —
 * ChatComposer пересчитывает и вызывает эту функцию заново на каждый
 * тик кулдауна (см. useMessageCooldown), поэтому секунды в подсказке
 * обновляются сами.
 */
export function describeSendError(code, retryAfterMs) {
  switch (code) {
    case "PROFANITY_DETECTED":
      return "Повідомлення містить ненормативну лексику. Перефразуйте, будь ласка.";
    case "CAPS_LOCK_DETECTED":
      return "Забагато великих літер — це сприймається як крик. Спробуйте звичайним регістром.";
    case "SPAM_DUPLICATE_DETECTED":
      return "Ви вже надсилали це повідомлення. Не повторюйте одне й те саме поспіль.";
    case "SPAM_LINKS_DETECTED":
      return "Повідомлення схоже на спам-розсилку посилань.";
    case "MUTED":
      return `Тимчасове обмеження за порушення правил чату. Спробуйте через ${formatSeconds(retryAfterMs)} с.`;
    case "RATE_LIMITED":
      return `Забагато повідомлень поспіль. Спробуйте через ${formatSeconds(retryAfterMs)} с.`;
    case "MESSAGE_VALIDATION_FAILED":
      return "Повідомлення порожнє або занадто довге.";
    default:
      return null;
  }
}

/**
 * describeCooldownHint — короткий текст ДЛЯ поля ввода ПОКА идёт
 * локальный/серверный кулдаун (до попытки отправки, проактивно) —
 * используется вместо describeSendError, у которой нет заранее
 * известного code (ошибки ещё не было, только отсчёт).
 */
export function describeCooldownHint(remainingMs) {
  if (remainingMs <= 0) return null;
  return `Можна надсилати повідомлення знову через ${formatSeconds(remainingMs)} с.`;
}
