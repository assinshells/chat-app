import { apiClient } from "@shared/api/axios.js";

/**
 * @param {{ verifiedToken: string, password: string, confirmPassword: string }} dto
 * @returns {Promise<{ success: boolean }>}
 */
export const resetPasswordRequest = (dto) =>
  apiClient.post("/api/auth/reset-password", dto).then((r) => r.data);