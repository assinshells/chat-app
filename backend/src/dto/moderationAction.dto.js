const cleanReason = (reason) =>
  typeof reason === "string" && reason.trim().length > 0
    ? reason.trim().slice(0, 300)
    : null;

export const toKickDto = (body) => ({
  login: body.login,
  room: body.room,
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
