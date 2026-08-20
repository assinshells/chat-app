export const CHAT_ERRORS = Object.freeze({
  ROOM_NOT_FOUND: "Room not found",
  VALIDATION_FAILED: "Validation failed",
});

export const CHAT_LIMITS = Object.freeze({
  MESSAGE_MAX_LENGTH: 2000,
  // Размер страницы истории сообщений (keyset-пагинация по id, см.
  // MessageRepository.findByRoom) — сколько сообщений отдаём за раз.
  HISTORY_PAGE_SIZE: 50,
});

// Имена Socket.IO событий. Фронтенд держит идентичный список в
// shared/constants/socket.constants.js — если меняешь одно, меняй оба.
export const SOCKET_EVENTS = Object.freeze({
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  // Снимок { [roomId]: count } — сколько сокетов сейчас в каждой
  // комнате. Шлётся новому соединению сразу при коннекте и всем
  // клиентам заново при любом join/leave/disconnect, чтобы список
  // комнат мог показывать актуальное число участников без отдельного
  // REST-опроса.
  ROOM_USER_COUNTS: "room:userCounts",
  MESSAGE_SEND: "message:send",
  MESSAGE_NEW: "message:new",
});
