import { apiClient } from "@shared/api/axios.js";

/**
 * @param {{ login: string, password: string, email?: string, gender: "male"|"female"|"unknown" }} dto
 * @returns {Promise<{ success: boolean }>}
 */
export const registerRequest = (dto) =>
  apiClient.post("/api/auth/register", dto).then((r) => r.data);