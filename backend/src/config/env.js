/**
 * Централізований, перевірений доступ до змінних оточення.
 * Одразу завершує роботу при старті, якщо відсутня обов'язкова змінна,
 * замість того щоб дозволити застосунку запуститись у зламаному стані
 * (наприклад, undefined рядок підключення до БД, CORS, що мовчки
 * блокує кожен запит).
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
      `Відсутні обов'язкові змінні оточення: ${missing.join(", ")}. ` +
        "Перевірте свій файл .env відносно backend/.env.example.",
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
    // Має залишатися синхронізованим з refreshExpiresIn вище — використовується
    // як TTL (у секундах) для білого списку в Redis для refresh-токена, оскільки
    // `expiresIn` у jsonwebtoken приймає рядки на кшталт "7d", які Redis EX не розуміє.
    refreshTtlSeconds: Number(getEnv("JWT_REFRESH_TTL_SECONDS", 604800)),
  },
  otpTtlSeconds: Number(getEnv("OTP_TTL_SECONDS", 600)),
  otpLength: Number(getEnv("OTP_LENGTH", 6)),
  // Максимум невірних спроб введення OTP до його примусової інвалідації.
  // Без цього ліміту OTP (6 цифр) можна підібрати перебором у межах TTL,
  // оскільки express-rate-limit обмежує запити за IP, а не за кодом.
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
