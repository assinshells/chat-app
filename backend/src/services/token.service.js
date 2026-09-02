import { TokenProvider } from "../providers/token.provider.js";
import { TokenRepository } from "../repositories/token.repository.js";
import { RefreshTokenInvalidException } from "../exceptions/auth.exceptions.js";

export const TokenService = {
  /**
   * Видає нову пару access/refresh токенів + CSRF-токен і
   * реєструє refresh-токен у whitelist (Redis), щоб його можна
   * було відкликати. CSRF-токен видається разом із парою і ротується
   * синхронно з refresh-токеном (див. cookie.provider.js).
   */
  async issueTokenPair(userId) {
    const accessToken = TokenProvider.signAccessToken(userId);
    const { token: refreshToken, jti } = TokenProvider.signRefreshToken(userId);
    const csrfToken = TokenProvider.generateCsrfToken();
    await TokenRepository.saveRefreshToken(jti, userId);
    return { accessToken, refreshToken, csrfToken };
  },

  /**
   * Ротація refresh-токена: перевіряє підпис/термін дії JWT,
   * переконується, що jti ще не відкликано, анулює старий токен і
   * видає нову пару. Одноразове використання refresh-токена
   * знижує шкоду від його витоку (replay після першого використання
   * буде відхилено).
   */
  async rotateRefreshToken(refreshToken) {
    let payload;
    try {
      payload = TokenProvider.verifyRefreshToken(refreshToken);
    } catch {
      throw new RefreshTokenInvalidException();
    }

    const storedUserId = await TokenRepository.findUserIdByJti(payload.jti);
    if (!storedUserId || storedUserId !== String(payload.sub)) {
      throw new RefreshTokenInvalidException();
    }

    await TokenRepository.deleteRefreshToken(payload.jti);
    return this.issueTokenPair(payload.sub);
  },

  /**
   * Відкликає refresh-токен (logout). Тихо завершується, якщо токен
   * вже недійсний/прострочений/відсутній — logout має бути ідемпотентним.
   */
  async revokeRefreshToken(refreshToken) {
    if (!refreshToken) return;
    try {
      const payload = TokenProvider.verifyRefreshToken(refreshToken);
      await TokenRepository.deleteRefreshToken(payload.jti);
    } catch {
      // токен вже минув/недійсний — відкликати нема чого
    }
  },
};