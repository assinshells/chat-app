import { apiClient } from "@shared/api/axios.js";

/**
 * fetchUserProfile — публічний профіль будь-якого користувача за логіном
 * (панель "Профіль" з меню дій біля ніка).
 *
 * @param {string} login
 * @returns {Promise<{ success: boolean, profile: {
 *   login: string, color: string, status: string, gender: string,
 *   displayName: string|null, about: string|null, city: string|null,
 *   maritalStatus: string|null } }>}
 */
export const fetchUserProfile = (login) =>
  apiClient
    .get(`/api/auth/profile/${encodeURIComponent(login)}`)
    .then((r) => r.data);
