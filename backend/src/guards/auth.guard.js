import { TokenProvider } from "../providers/token.provider.js";
import { AccessTokenInvalidException } from "../exceptions/auth.exceptions.js";

/**
 * authGuard — Express middleware.
 * Ожидает заголовок `Authorization: Bearer <accessToken>`, проверяет
 * подпись/срок действия JWT (без обращения к БД/Redis — access-токен
 * полностью stateless) и пробрасывает userId в req.
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