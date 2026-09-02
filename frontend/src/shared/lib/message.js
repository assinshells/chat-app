/**
 * normalizeMessageText — прибирає переноси рядків з введеного/вставленого
 * тексту, згортаючи їх у пробіл. Так вертикальний (багаторядковий) текст,
 * вставлений користувачем, перетворюється на один горизонтальний рядок.
 * \r\n, \r, \n, а також юнікодні розділювачі рядків/абзаців (U+2028, U+2029)
 * враховуються однаково.
 */
export function normalizeMessageText(value) {
  return value.replace(/[\r\n\u2028\u2029]+/g, " ");
}

/**
 * formatMessageTime — форматує timestamp у вигляд "20:10:05" (HH:MM:SS,
 * 24-годинний формат).
 */
export function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
