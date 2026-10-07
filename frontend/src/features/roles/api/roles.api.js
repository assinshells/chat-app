import { apiClient } from "@shared/api/axios.js";

/**
 * @param {string} login
 * @returns {Promise<{ login: string, role: string, rooms: string[], canReviewPhotos: boolean }>}
 */
export const getRoleInfoRequest = (login) =>
  apiClient.get(`/api/roles/${encodeURIComponent(login)}`).then((r) => r.data);

/**
 * @param {{ login: string, role: "moderator"|"admin", rooms?: string[], canReviewPhotos?: boolean }} dto
 */
export const assignRoleRequest = ({ login, role, rooms = [], canReviewPhotos = false }) =>
  apiClient
    .post("/api/roles/assign", { login, role, rooms, canReviewPhotos })
    .then((r) => r.data);

/**
 * @param {string} login
 */
export const removeRoleRequest = (login) =>
  apiClient.post("/api/roles/remove", { login }).then((r) => r.data);
