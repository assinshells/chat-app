import { apiClient } from "@shared/api/axios.js";

/**
 * refreshToken больше не передаётся явно — backend читает его из
 * httpOnly cookie, которую браузер приложит сам (apiClient настроен
 * с withCredentials: true).
 * @returns {Promise<{ success: boolean }>}
 */
export const logoutRequest = () =>
  apiClient.post("/api/auth/logout").then((r) => r.data);