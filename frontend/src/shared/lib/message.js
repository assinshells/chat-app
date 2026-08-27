/**
 * normalizeMessageText — убирает переносы строк из введённого/вставленного
 * текста, схлопывая их в пробел. Так вертикальный (многострочный) текст,
 * вставленный пользователем, превращается в одну горизонтальную строку.
 * \r\n, \r, \n, а также юникодные разделители строк/абзацев (U+2028, U+2029)
 * учитываются одинаково.
 */
export function normalizeMessageText(value) {
  return value.replace(/[\r\n\u2028\u2029]+/g, " ");
}

/**
 * formatMessageTime — форматирует timestamp в вид "20:10:05" (HH:MM:SS,
 * 24-часовой формат).
 */
export function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}