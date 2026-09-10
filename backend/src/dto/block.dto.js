import { DEFAULT_COLOR } from "../constants/auth.constants.js";

/**
 * @typedef {Object} BlockedUserDto
 * @property {string} login
 * @property {string} color
 * @property {number} blockedAt - unix ms, коли видано блокування
 */
export const toBlockedUserDto = (row) => ({
  login: row.login,
  color: row.color ?? DEFAULT_COLOR,
  blockedAt: new Date(row.created_at).getTime(),
});
