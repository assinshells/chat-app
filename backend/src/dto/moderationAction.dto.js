const cleanReason = (reason) =>
  typeof reason === "string" && reason.trim().length > 0
    ? reason.trim().slice(0, 300)
    : null;

export const toKickDto = (body) => ({
  login: body.login,
  room: body.room,
  durationMs: Number(body.durationMs),
  reason: cleanReason(body.reason),
});

// KICK_CHAT — durationMs необов'язковий у body: якщо не переданий (або
// не є числом), сервіс сам підставить дефолт (10 хв) — це саме той
// шлях, яким користується UI модератора, де взагалі немає поля вводу
// тривалості (див. resolveDurationMs у moderationAction.service.js).
export const toKickChatDto = (body) => ({
  login: body.login,
  durationMs:
    body.durationMs !== null && body.durationMs !== undefined
      ? Number(body.durationMs)
      : undefined,
  reason: cleanReason(body.reason),
});

// BAN_ROOM — durationMs === null означає "назавжди" (лише
// admin/superadmin, сервіс форсує дефолт для модератора). room тут
// НЕ передається клієнтом: список кімнат для бану сервіс визначає сам
// за правами актора (moderatorRooms/усі кімнати), а не за тим, з якого
// меню відкрито модалку.
export const toBanRoomDto = (body) => ({
  login: body.login,
  durationMs: body.durationMs != null ? Number(body.durationMs) : null,
  reason: cleanReason(body.reason),
});

export const toBanDto = (body) => ({
  login: body.login,
  scope: body.scope,
  room: body.scope === "room" ? body.room : null,
  durationMs: body.durationMs != null ? Number(body.durationMs) : null,
  reason: cleanReason(body.reason),
});

export const toUnbanDto = (body) => ({
  banId: Number(body.banId),
});
