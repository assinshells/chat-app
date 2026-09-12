import { DEFAULT_COLOR } from "../constants/auth.constants.js";

/**
 * @typedef {Object} FriendUserDto
 * @property {string} login
 * @property {string} color
 * @property {number} friendedAt - unix ms, коли додано до друзів
 */
export const toFriendUserDto = (row) => ({
  login: row.login,
  color: row.color ?? DEFAULT_COLOR,
  friendedAt: new Date(row.created_at).getTime(),
});
