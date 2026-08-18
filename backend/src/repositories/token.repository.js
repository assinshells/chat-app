import { redisClient } from "../config/redis.js";
import { REDIS_KEYS } from "../constants/auth.constants.js";
import { authConfig } from "../config/auth.config.js";

/**
 * TokenRepository — whitelist выданных refresh-токенов в Redis.
 * Ключ — jti токена, значение — userId. Наличие записи означает,
 * что токен ещё не отозван (logout, ротация, компрометация).
 */
export const TokenRepository = {
  async saveRefreshToken(jti, userId) {
    await redisClient.set(REDIS_KEYS.refreshToken(jti), String(userId), {
      EX: authConfig.jwt.refreshToken.ttlSeconds,
    });
  },

  async findUserIdByJti(jti) {
    return redisClient.get(REDIS_KEYS.refreshToken(jti));
  },

  async deleteRefreshToken(jti) {
    await redisClient.del(REDIS_KEYS.refreshToken(jti));
  },
};