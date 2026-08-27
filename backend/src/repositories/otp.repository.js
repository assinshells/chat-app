import { redisClient } from "../config/redis.js";
import { REDIS_KEYS } from "../constants/auth.constants.js";
import { authConfig } from "../config/auth.config.js";

/**
 * OtpRepository — работа с OTP и verified-токенами в Redis.
 */
export const OtpRepository = {
  async saveOtp(userId, otp) {
    await redisClient.set(REDIS_KEYS.otp(userId), otp, {
      EX: authConfig.otp.ttlSeconds,
    });
  },

  async getOtp(userId) {
    return redisClient.get(REDIS_KEYS.otp(userId));
  },

  async deleteOtp(userId) {
    await redisClient.del(REDIS_KEYS.otp(userId));
  },

  /**
   * Инкрементирует счётчик неверных попыток ввода OTP для userId.
   * TTL счётчика выставляется равным OTP TTL при первом инкременте,
   * чтобы счётчик не пережил сам код и не блокировал следующий запрос OTP.
   */
  async incrementAttempts(userId) {
    const key = REDIS_KEYS.otpAttempts(userId);
    const count = await redisClient.incr(key);
    if (count === 1) {
      await redisClient.expire(key, authConfig.otp.ttlSeconds);
    }
    return count;
  },

  async deleteAttempts(userId) {
    await redisClient.del(REDIS_KEYS.otpAttempts(userId));
  },

  async saveVerifiedToken(token, userId) {
    await redisClient.set(REDIS_KEYS.otpVerified(token), String(userId), {
      EX: authConfig.otp.ttlSeconds,
    });
  },

  async getVerifiedToken(token) {
    return redisClient.get(REDIS_KEYS.otpVerified(token));
  },

  async deleteVerifiedToken(token) {
    await redisClient.del(REDIS_KEYS.otpVerified(token));
  },
};