import { env } from "./env.js";

/**
 * authConfig — derived view over `env` shaped the way the auth/session/otp
 * providers consume it. All env parsing (including required-var validation)
 * lives in env.js; this file must never read process.env directly, or the
 * two configs can silently drift out of sync (this used to happen).
 */
export const authConfig = {
  jwt: {
    accessToken: {
      secret: env.jwt.accessSecret,
      expiresIn: env.jwt.accessExpiresIn,
    },
    refreshToken: {
      secret: env.jwt.refreshSecret,
      expiresIn: env.jwt.refreshExpiresIn,
      ttlSeconds: env.jwt.refreshTtlSeconds,
    },
  },
  otp: {
    ttlSeconds: env.otpTtlSeconds,
    length: env.otpLength,
    maxAttempts: env.otpMaxAttempts,
  },
  rateLimit: {
    windowMs: env.rateLimit.windowMs,
    login: { max: env.rateLimit.loginMax },
    register: { max: env.rateLimit.registerMax },
    forgotPassword: { max: env.rateLimit.forgotMax },
    verifyOtp: { max: env.rateLimit.otpMax },
    resetPassword: { max: env.rateLimit.resetMax },
    refresh: { max: env.rateLimit.refreshMax },
  },
};