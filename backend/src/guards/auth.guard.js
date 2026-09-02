import { TokenProvider } from "../providers/token.provider.js";
import { AccessTokenInvalidException } from "../exceptions/auth.exceptions.js";

/**
 * authGuard — Express middleware.
 * Очікує заголовок `Authorization: Bearer <accessToken>`, перевіряє
 * підпис/термін дії JWT (без звернення до БД/Redis — access-токен
 * повністю stateless) і передає userId у req.
 */
export const authGuard = (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return next(new AccessTokenInvalidException());

  try {
    const payload = TokenProvider.verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    next(new AccessTokenInvalidException());
  }
};