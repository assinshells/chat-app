import { apiClient } from "@shared/api/axios.js";

/**
 * @param {{ login: string, password: string, email?: string }} dto
 * @returns {Promise<{ success: boolean }>}
 *
 * Стать сюди не входить — вона обирається на формі входу одразу після
 * реєстрації (див. LoginForm.jsx / useLoginStore.js).
 */
export const registerRequest = (dto) =>
  apiClient.post("/api/auth/register", dto).then((r) => r.data);
