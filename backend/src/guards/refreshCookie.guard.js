import { COOKIE_NAMES } from "../constants/auth.constants.js";
import { RefreshTokenInvalidException } from "../exceptions/auth.exceptions.js";

/**
 * refreshCookieGuard — Express middleware.
 * Дістає refresh-токен з httpOnly cookie (встановлюється CookieProvider
 * при login/refresh) і кладе в req.refreshToken. Замінює попереднє читання
 * refreshToken з тіла запиту — токен більше не повинен бути доступний JS.
 */
export const refreshCookieGuard = (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NAMES.refreshToken];
  if (!token) return next(new RefreshTokenInvalidException());
  req.refreshToken = token;
  next();
};
