import { COOKIE_NAMES } from "../constants/auth.constants.js";
import { authConfig } from "../config/auth.config.js";
import { env } from "../config/env.js";

/**
 * CookieProvider — единственная точка установки/очистки auth-cookies.
 *
 * refreshToken: httpOnly, недоступен из JS — защищает от кражи через XSS.
 * Ограничен path: "/api/auth" — нужен только auth-роутам.
 *
 * csrfToken: НЕ httpOnly (сознательно) — double-submit-cookie паттерн
 * требует, чтобы клиент мог прочитать его и продублировать в заголовке
 * X-CSRF-Token; сравнение cookie === header в middlewares/csrf.middleware.js
 * подтверждает, что запрос пришёл не с чужого сайта (сторонний сайт не
 * может прочитать чужие cookies, а значит не сможет подставить верный
 * заголовок). Ограничен path: "/" — иначе document.cookie на фронтенде
 * (который рендерится на "/", "/login" и т.д., а не на "/api/auth") не
 * видит cookie вовсе.
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
    // path: "/" — сознательно шире, чем у refreshToken. csrfToken не
    // httpOnly и должен читаться из document.cookie на любой странице
    // SPA (frontend рендерится на "/", "/login" и т.д., а не на
    // "/api/auth"), иначе getCsrfToken() на фронте всегда возвращает
    // null и любой запрос на /refresh или /logout падает с 403
    // (csrf.middleware видит cookie, но не видит совпадающий заголовок).
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