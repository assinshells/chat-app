import { apiClient } from "@shared/api/axios.js";

/**
 * refreshToken більше не передається явно — backend читає його з
 * httpOnly cookie, яку браузер додасть сам (apiClient налаштований
 * з withCredentials: true).
 * @returns {Promise<{ success: boolean }>}
 */
export const logoutRequest = () =>
  apiClient.post("/api/auth/logout").then((r) => r.data);