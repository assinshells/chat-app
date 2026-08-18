/**
 * Centralized, validated access to environment variables.
 * Fails fast at startup if a required variable is missing, instead of
 * letting the app boot into a broken state (e.g. undefined DB connection
 * string, CORS silently blocking every request).
 */

const REQUIRED_VARS = [
  "PORT",
  "CLIENT_URL",
  "DATABASE_URL",
  "REDIS_URL",
  "NODE_ENV",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];

function getEnv(name, fallback) {
  const value = process.env[name] ?? fallback;
  return value;
}

function assertRequiredEnv() {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        "Check your .env file against backend/.env.example.",
    );
  }
}

export const env = {
  nodeEnv: getEnv("NODE_ENV", "development"),
  isProduction: process.env.NODE_ENV === "production",
  port: Number(getEnv("PORT", 3000)),
  clientUrl: getEnv("CLIENT_URL"),
  databaseUrl: getEnv("DATABASE_URL"),
  redisUrl: getEnv("REDIS_URL"),
  jwt: {
    accessSecret: getEnv("JWT_ACCESS_SECRET"),
    refreshSecret: getEnv("JWT_REFRESH_SECRET"),
    accessExpiresIn: getEnv("JWT_ACCESS_EXPIRES_IN", "15m"),
    refreshExpiresIn: getEnv("JWT_REFRESH_EXPIRES_IN", "7d"),
    // Must stay in sync with refreshExpiresIn above — used as the Redis
    // whitelist TTL (seconds) for the refresh token, since jsonwebtoken's
    // `expiresIn` accepts human strings ("7d") that Redis EX cannot.
    refreshTtlSeconds: Number(getEnv("JWT_REFRESH_TTL_SECONDS", 604800)),
  },
  otpTtlSeconds: Number(getEnv("OTP_TTL_SECONDS", 600)),
  otpLength: Number(getEnv("OTP_LENGTH", 6)),
  // Максимум неверных попыток ввода OTP до его принудительной инвалидации.
  // Без этого лимита OTP (6 цифр) можно подобрать перебором в пределах TTL,
  // так как express-rate-limit ограничивает запросы по IP, а не по коду.
  otpMaxAttempts: Number(getEnv("OTP_MAX_ATTEMPTS", 5)),
  rateLimit: {
    loginMax: Number(getEnv("RATE_LIMIT_LOGIN_MAX", 10)),
    registerMax: Number(getEnv("RATE_LIMIT_REGISTER_MAX", 5)),
    forgotMax: Number(getEnv("RATE_LIMIT_FORGOT_MAX", 5)),
    otpMax: Number(getEnv("RATE_LIMIT_OTP_MAX", 10)),
    resetMax: Number(getEnv("RATE_LIMIT_RESET_MAX", 5)),
    refreshMax: Number(getEnv("RATE_LIMIT_REFRESH_MAX", 30)),
    windowMs: Number(getEnv("RATE_LIMIT_WINDOW_MS", 900000)),
  },
};

export { assertRequiredEnv };