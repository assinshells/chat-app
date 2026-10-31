import { apiClient } from "@shared/api/axios.js";

/**
 * Єдина точка входу: сервер сам вирішує, що відбулося.
 * @param {{ login: string, password: string }} dto
 * @returns {Promise<
 *   | { status: "authenticated", accessToken: string, csrfToken: string }
 *   | { status: "registration_required", expiresInSeconds: number }
 * >}
 * authenticated: refreshToken встановлюється як httpOnly cookie на бекенді —
 * він ніколи не входить у тіло відповіді.
 * registration_required: логіна ще немає; сервер створив тимчасову
 * реєстраційну сесію (httpOnly cookie regSession) — користувача в БД немає,
 * його буде створено лише на кроці "В чат".
 */
export const loginRequest = (dto) =>
  apiClient.post("/api/auth/login", dto).then((r) => r.data);