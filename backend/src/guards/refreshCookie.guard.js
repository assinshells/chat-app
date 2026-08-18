import { COOKIE_NAMES } from "../constants/auth.constants.js";
import { RefreshTokenInvalidException } from "../exceptions/auth.exceptions.js";

/**
 * refreshCookieGuard — Express middleware.
 * Достаёт refresh-токен из httpOnly cookie (устанавливается CookieProvider
 * при login/refresh) и кладёт в req.refreshToken. Заменяет прежнее чтение
 * refreshToken из тела запроса — токен больше не должен быть доступен JS.
 */
export const refreshCookieGuard = (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NAMES.refreshToken];
  if (!token) return next(new RefreshTokenInvalidException());
  req.refreshToken = token;
  next();
};
