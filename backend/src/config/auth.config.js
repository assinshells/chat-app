import { env } from "./env.js";

/**
 * authConfig — похідне представлення `env`, приведене до вигляду, зручного
 * для провайдерів auth/session/otp. Увесь розбір env (включно з перевіркою
 * обов'язкових змінних) живе в env.js; цей файл ніколи не повинен читати
 * process.env напряму, інакше два конфіги можуть непомітно розійтися
 * (таке вже траплялося).
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
