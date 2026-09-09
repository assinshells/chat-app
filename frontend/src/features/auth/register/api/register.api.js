import { apiClient } from "@shared/api/axios.js";

/**
 * @param {{ login: string, password: string, email?: string, gender: string, color?: string }} dto
 * @returns {Promise<{ success: boolean }>}
 *
 * Стать і колір обираються прямо на формі реєстрації (див. RegisterForm.jsx).
 */
export const registerRequest = (dto) =>
  apiClient.post("/api/auth/register", dto).then((r) => r.data);
