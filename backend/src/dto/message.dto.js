import { DEFAULT_COLOR } from "../constants/auth.constants.js";

/**
 * @typedef {Object} MessageDto
 * @property {string} id
 * @property {string} author - login автора повідомлення
 * @property {string} text
 * @property {number} timestamp - unix ms, сумісно з formatMessageTime на фронтенді
 * @property {string} room
 * @property {string} color - колір повідомлення/ніка автора на момент відправлення
 *   ('black' | 'blue' | 'green' | 'purple' | 'orange'), см. COLOR_OPTIONS
 */

export const toMessageDto = (row) => ({
  id: String(row.id),
  author: row.author_login ?? row.author,
  text: row.text,
  timestamp: new Date(row.created_at).getTime(),
  room: row.room,
  color: row.author_color ?? row.color ?? DEFAULT_COLOR,
});