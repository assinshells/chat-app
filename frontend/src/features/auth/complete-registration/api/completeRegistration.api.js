import { apiClient } from "@shared/api/axios.js";

/**
 * Другий крок єдиного потоку входу. Логін і пароль сюди НЕ передаються:
 * сервер бере їх із тимчасової реєстраційної сесії (httpOnly cookie
 * regSession, виставляється відповіддю POST /api/auth/login для нового логіна).
 */

/**
 * @returns {Promise<{ login: string, expiresInSeconds: number }>}
 * 410 REGISTRATION_SESSION_EXPIRED, якщо сесії немає або вона прострочена.
 */
export const getRegistrationSession = () =>
  apiClient.get("/api/auth/register/session").then((r) => r.data);

/**
 * @param {{ email: string|null, noEmail: boolean, captchaToken?: string }} dto
 * @returns {Promise<{ login: string, accessToken: string, csrfToken: string }>}
 * Створює користувача й одразу авторизує (cookie refreshToken/csrfToken).
 */
export const completeRegistrationRequest = (dto) =>
  apiClient.post("/api/auth/register", dto).then((r) => r.data);

/** Скасувати незавершену реєстрацію ("Назад до входу"). */
export const cancelRegistrationRequest = () =>
  apiClient.delete("/api/auth/register/session").then((r) => r.data);
