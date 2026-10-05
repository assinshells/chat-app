import { DEFAULT_COLOR } from "../constants/auth.constants.js";

/**
 * @typedef {Object} MessageDto
 * @property {string} id
 * @property {string} author - login автора повідомлення
 * @property {string} text
 * @property {number} timestamp - unix ms, сумісно з formatMessageTime на фронтенді
 * @property {string} room
 * @property {{id: string}|null} image - вкладення (саме зображення завантажується
 *   окремо за GET /api/images/:id, у повідомленні лише його id)
 * @property {string} color - колір повідомлення/ніка автора на момент відправлення,
 *   одне з COLOR_OPTIONS (constants/auth.constants.js — повний спектр з 20 відтінків)
 */

export const toMessageDto = (row) => ({
  id: String(row.id),
  author: row.author_login ?? row.author,
  text: row.text,
  timestamp: new Date(row.created_at).getTime(),
  room: row.room,
  image: row.image_id ? { id: String(row.image_id) } : null,
  color: row.author_color ?? row.color ?? DEFAULT_COLOR,
});