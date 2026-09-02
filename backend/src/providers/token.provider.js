import jwt from "jsonwebtoken";
import crypto from "crypto";
import { authConfig } from "../config/auth.config.js";

/**
 * TokenProvider — єдина точка роботи з JWT (підпис/перевірка).
 * Access-токен: короткоживучий, містить лише userId, перевіряється
 * без звернення до БД/Redis (повністю stateless).
 * Refresh-токен: довгоживучий, містить userId + jti (унікальний id
 * токена); сам jti кладеться в Redis-репозиторій, щоб токен можна
 * було відкликати (logout / ротація) — інакше валідний JWT не можна
 * було б анулювати до завершення терміну дії.
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

  // Opaque-токен для double-submit CSRF-cookie. Не JWT — не несе
  // жодних claims, йому потрібно лише бути непередбачуваним і
  // збігатися зі значенням, яке клієнт повертає в заголовку X-CSRF-Token.
  generateCsrfToken() {
    return crypto.randomBytes(32).toString("hex");
  },
};
