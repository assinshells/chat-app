import { ChatValidationException } from "../exceptions/chat.exceptions.js";
import { CHAT_LIMITS } from "../constants/chat.constants.js";

const isNonEmptyString = (val) =>
  typeof val === "string" && val.trim().length > 0;

export const validateHistoryQuery = (query) => {
  const errors = [];
  if (query.before !== undefined && !Number.isInteger(Number(query.before))) {
    errors.push("before must be a numeric message id");
  }
  if (errors.length) throw new ChatValidationException("Validation failed", errors);
};

/**
 * Общий валидатор payload'а отправки сообщения — используется и
 * Socket.IO хендлером (chat.socket.js), поэтому не завязан на Express
 * req/res, только на сам объект payload. roomId — строковый id из
 * статического списка комнат (см. constants/rooms.data.js); сама
 * принадлежность списку проверяется отдельно, в RoomService.assertRoomExists.
 */
export const validateSendMessagePayload = (payload) => {
  const errors = [];
  if (!isNonEmptyString(payload?.roomId)) errors.push("roomId is required");
  if (!isNonEmptyString(payload?.content)) {
    errors.push("content is required");
  } else if (payload.content.trim().length > CHAT_LIMITS.MESSAGE_MAX_LENGTH) {
    errors.push(`content must be at most ${CHAT_LIMITS.MESSAGE_MAX_LENGTH} characters`);
  }
  // recipientIds — опционален (сообщение "всем"), но если передан,
  // это только форма payload'а: существование самих пользователей и
  // отсечение своего id — уже забота MessageService (нужен доступ к БД
  // и к senderId, которых тут нет).
  if (payload?.recipientIds !== undefined) {
    if (!Array.isArray(payload.recipientIds)) {
      errors.push("recipientIds must be an array");
    } else if (payload.recipientIds.length > CHAT_LIMITS.MAX_RECIPIENTS) {
      errors.push(`recipientIds must contain at most ${CHAT_LIMITS.MAX_RECIPIENTS} users`);
    } else if (!payload.recipientIds.every((id) => Number.isInteger(id) && id > 0)) {
      errors.push("recipientIds must contain valid user ids");
    }
  }
  if (errors.length) throw new ChatValidationException("Validation failed", errors);
};