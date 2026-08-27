import { apiClient } from "@shared/api/axios.js";

/**
 * @param {{ login: string, password: string }} dto
 * @returns {Promise<{ accessToken: string, csrfToken: string }>}
 * refreshToken is set as an httpOnly cookie by the backend — it's never
 * part of the response body.
 */
export const loginRequest = (dto) =>
  apiClient.post("/api/auth/login", dto).then((r) => r.data);