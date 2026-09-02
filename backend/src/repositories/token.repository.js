import { redisClient } from "../config/redis.js";
import { REDIS_KEYS } from "../constants/auth.constants.js";
import { authConfig } from "../config/auth.config.js";

/**
 * TokenRepository — whitelist виданих refresh-токенів у Redis.
 * Ключ — jti токена, значення — userId. Наявність запису означає,
 * що токен ще не відкликано (logout, ротація, компрометація).
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