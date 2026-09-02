import { apiClient } from "@shared/api/axios.js";

/**
 * @param {{ login: string, password: string }} dto
 * @returns {Promise<{ accessToken: string, csrfToken: string }>}
 * refreshToken встановлюється як httpOnly cookie на бекенді — він ніколи
 * не входить у тіло відповіді.
 */
export const loginRequest = (dto) =>
  apiClient.post("/api/auth/login", dto).then((r) => r.data);