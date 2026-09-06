import { apiClient } from "@shared/api/axios.js";

/**
 * @returns {Promise<{ user: { id, login, email, gender, color, role, moderatorRooms } }>}
 */
export const fetchMe = () => apiClient.get("/api/auth/me").then((r) => r.data);
