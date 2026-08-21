// Зеркало backend/src/constants/chat.constants.js#SOCKET_EVENTS —
// при изменении имени события менять в обоих местах.
export const SOCKET_EVENTS = Object.freeze({
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  ROOM_USER_COUNTS: "room:userCounts",
  MESSAGE_SEND: "message:send",
  MESSAGE_NEW: "message:new",
});

// Зеркало backend/src/constants/chat.constants.js#CHAT_LIMITS.MAX_RECIPIENTS —
// максимум ников, которых можно выбрать адресатами одного сообщения.
export const MAX_MESSAGE_RECIPIENTS = 3;