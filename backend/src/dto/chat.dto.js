/**
 * @typedef {Object} SendMessageDto
 * @property {string} roomId
 * @property {string} content
 * @property {number[]} [recipientIds] - до CHAT_LIMITS.MAX_RECIPIENTS id получателей (клик по нику)
 */

/**
 * @typedef {Object} RoomResponseDto
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} MessageResponseDto
 * @property {number} id
 * @property {string} roomId
 * @property {number} authorId
 * @property {string} authorLogin
 * @property {string} content
 * @property {string} createdAt
 * @property {number[]} recipientIds - id адресатов, [] = сообщение всей комнате
 * @property {string[]} recipientLogins - логины адресатов, тот же порядок, что и recipientIds
 */

export const toSendMessageDto = (payload) => ({
  roomId: typeof payload?.roomId === "string" ? payload.roomId.trim() : "",
  content: typeof payload?.content === "string" ? payload.content.trim() : "",
  recipientIds: Array.isArray(payload?.recipientIds) ? payload.recipientIds : [],
});

// Список комнат статический (см. constants/rooms.data.js) — DTO здесь
// только фиксирует форму ответа API, самих данных не трансформирует.
export const toRoomResponseDto = (room) => ({
  id: room.id,
  name: room.name,
});

export const toMessageResponseDto = (row) => ({
  id: row.id,
  roomId: row.room_id,
  authorId: row.user_id,
  authorLogin: row.author_login,
  content: row.content,
  createdAt: row.created_at,
  recipientIds: row.recipient_ids ?? [],
  recipientLogins: row.recipient_logins ?? [],
});