/**
 * @typedef {Object} AssignRoleDto
 * @property {string} login - логін цільового користувача
 * @property {"moderator"|"admin"} role
 * @property {string[]} rooms - лише для role = "moderator"
 * @property {boolean} canReviewPhotos - лише для role = "moderator"
 */
export const toAssignRoleDto = (body) => ({
  login: body.login,
  role: body.role,
  rooms: Array.isArray(body.rooms) ? body.rooms : [],
  canReviewPhotos: body.canReviewPhotos === true,
});

/**
 * @typedef {Object} RemoveRoleDto
 * @property {string} login
 */
export const toRemoveRoleDto = (body) => ({
  login: body.login,
});
