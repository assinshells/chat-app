/**
 * Коди приходять від backend/src/sockets/chat.socket.js в ack
 * { success:false, code, message, details? } — див. exceptions/chat.exceptions.js
 * і moderation/moderation.service.js. Текст підказок тут, а не на
 * бекенді: сервер віддає технічний code + details (числа), а
 * людське формулювання мовою інтерфейсу підбирає клієнт —
 * так бекенд не прив'язаний до конкретної мови UI.
 */
const SECOND = 1000;

function formatSeconds(ms) {
  return Math.max(1, Math.ceil(ms / SECOND));
}

/**
 * describeSendError — текст для chat-input-hint під полем вводу.
 * retryAfterMs (якщо є) вже "живий" залишок на момент виклику —
 * ChatComposer перераховує і викликає цю функцію заново на кожен
 * тік кулдауна (див. useMessageCooldown), тому секунди в підказці
 * оновлюються самі.
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
 * describeCooldownHint — короткий текст ДЛЯ поля вводу ПОКИ триває
 * локальний/серверний кулдаун (до спроби відправлення, проактивно) —
 * використовується замість describeSendError, у якої немає заздалегідь
 * відомого code (помилки ще не було, лише відлік).
 */
export function describeCooldownHint(remainingMs) {
  if (remainingMs <= 0) return null;
  return `Можна надсилати повідомлення знову через ${formatSeconds(remainingMs)} с.`;
}
