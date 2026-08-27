import jwt from "jsonwebtoken";
import crypto from "crypto";
import { authConfig } from "../config/auth.config.js";

/**
 * TokenProvider — единственная точка работы с JWT (подпись/проверка).
 * Access-токен: короткоживущий, содержит только userId, проверяется
 * без обращения к БД/Redis (полностью stateless).
 * Refresh-токен: долгоживущий, содержит userId + jti (уникальный id
 * токена); сам jti кладётся в Redis-репозиторий, чтобы токен можно
 * было отозвать (logout / ротация) — иначе валидный JWT нельзя было
 * бы аннулировать до истечения срока действия.
 */
export const TokenProvider = {
  signAccessToken(userId) {
    return jwt.sign({ sub: userId, type: "access" }, authConfig.jwt.accessToken.secret, {
      expiresIn: authConfig.jwt.accessToken.expiresIn,
    });
  },

  signRefreshToken(userId, jti = crypto.randomUUID()) {
    const token = jwt.sign(
      { sub: userId, type: "refresh", jti },
      authConfig.jwt.refreshToken.secret,
      { expiresIn: authConfig.jwt.refreshToken.expiresIn },
    );
    return { token, jti };
  },

  verifyAccessToken(token) {
    return jwt.verify(token, authConfig.jwt.accessToken.secret);
  },

  verifyRefreshToken(token) {
    return jwt.verify(token, authConfig.jwt.refreshToken.secret);
  },

  // Opaque token for the double-submit CSRF cookie. Not a JWT — it carries
  // no claims, it only needs to be unguessable and to match the value the
  // client echoes back in the X-CSRF-Token header.
  generateCsrfToken() {
    return crypto.randomBytes(32).toString("hex");
  },
};