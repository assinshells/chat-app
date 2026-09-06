import { apiClient } from "@shared/api/axios.js";

/**
 * @param {string} login
 * @returns {Promise<{ login: string, role: string, rooms: string[] }>}
 */
export const getRoleInfoRequest = (login) =>
  apiClient.get(`/api/roles/${encodeURIComponent(login)}`).then((r) => r.data);

/**
 * @param {{ login: string, role: "moderator"|"admin", rooms?: string[] }} dto
 */
export const assignRoleRequest = ({ login, role, rooms = [] }) =>
  apiClient
    .post("/api/roles/assign", { login, role, rooms })
    .then((r) => r.data);

/**
 * @param {string} login
 */
export const removeRoleRequest = (login) =>
  apiClient.post("/api/roles/remove", { login }).then((r) => r.data);
