import { apiClient } from "@shared/api/axios.js";

/**
 * @param {{ email: string }} dto
 * @returns {Promise<{ success: boolean }>}
 */
export const forgotPasswordRequest = (dto) =>
  apiClient.post("/api/auth/forgot-password", dto).then((r) => r.data);