import { DEFAULT_COLOR } from "../constants/auth.constants.js";

/**
 * @typedef {Object} PrivateMessageDto
 * @property {string} id
 * @property {string} sender - login отправителя
 * @property {string} recipient - login получателя
 * @property {string} text
 * @property {number} timestamp - unix ms
 * @property {string} color - цвет отправителя на момент отправки (та же
 *   палитра, что и у публичных сообщений, см. COLOR_OPTIONS)
 */
export const toPrivateMessageDto = (row) => ({
  id: String(row.id),
  sender: row.sender_login ?? row.sender,
  recipient: row.recipient_login ?? row.recipient,
  text: row.text,
  timestamp: new Date(row.created_at).getTime(),
  color: row.sender_color ?? row.color ?? DEFAULT_COLOR,
});

/**
 * @typedef {Object} ConversationSummaryDto
 * @property {string} login - собеседник (не сам пользователь)
 * @property {string} color
 * @property {{ text: string, timestamp: number, own: boolean }} lastMessage
 */
export const toConversationSummaryDto = (row) => ({
  login: row.other_login,
  color: row.other_color ?? DEFAULT_COLOR,
  lastMessage: {
    text: row.last_text,
    timestamp: new Date(row.last_at).getTime(),
    own: Boolean(row.is_own),
  },
});
