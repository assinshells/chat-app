/**
 * @typedef {Object} MessageDto
 * @property {string} id
 * @property {string} author - login автора сообщения
 * @property {string} text
 * @property {number} timestamp - unix ms, совместимо с formatMessageTime на фронтенде
 * @property {string} room
 */

export const toMessageDto = (row) => ({
  id: String(row.id),
  author: row.author_login ?? row.author,
  text: row.text,
  timestamp: new Date(row.created_at).getTime(),
  room: row.room,
});