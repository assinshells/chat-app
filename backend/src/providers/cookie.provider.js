import { COOKIE_NAMES } from "../constants/auth.constants.js";
import { authConfig } from "../config/auth.config.js";
import { env } from "../config/env.js";

/**
 * CookieProvider — єдина точка встановлення/очищення auth-cookies.
 *
 * refreshToken: httpOnly, недоступний з JS — захищає від крадіжки через XSS.
 * Обмежений path: "/api/auth" — потрібен лише auth-маршрутам.
 *
 * csrfToken: НЕ httpOnly (свідомо) — патерн double-submit-cookie
 * вимагає, щоб клієнт міг прочитати його і продублювати в заголовку
 * X-CSRF-Token; порівняння cookie === header у middlewares/csrf.middleware.js
 * підтверджує, що запит прийшов не з чужого сайту (сторонній сайт не
 * може прочитати чужі cookies, а отже не зможе підставити правильний
 * заголовок). Обмежений path: "/" — інакше document.cookie на фронтенді
 * (який рендериться на "/", "/login" тощо, а не на "/api/auth") взагалі
 * не бачить cookie.
 */
const baseCookieOptions = {
  secure: env.isProduction,
  sameSite: "strict",
  maxAge: authConfig.jwt.refreshToken.ttlSeconds * 1000,
};

export const CookieProvider = {
  setAuthCookies(res, { refreshToken, csrfToken }) {
    res.cookie(COOKIE_NAMES.refreshToken, refreshToken, {
      ...baseCookieOptions,
      path: "/api/auth",
      httpOnly: true,
    });
    // path: "/" — свідомо ширший, ніж у refreshToken. csrfToken не
    // httpOnly і має читатися з document.cookie на будь-якій сторінці
    // SPA (frontend рендериться на "/", "/login" тощо, а не на
    // "/api/auth"), інакше getCsrfToken() на фронті завжди повертає
    // null і будь-який запит на /refresh чи /logout падає з 403
    // (csrf.middleware бачить cookie, але не бачить відповідний заголовок).
    res.cookie(COOKIE_NAMES.csrfToken, csrfToken, {
      ...baseCookieOptions,
      path: "/",
      httpOnly: false,
    });
  },

  clearAuthCookies(res) {
    res.clearCookie(COOKIE_NAMES.refreshToken, { path: "/api/auth" });
    res.clearCookie(COOKIE_NAMES.csrfToken, { path: "/" });
  },
};
