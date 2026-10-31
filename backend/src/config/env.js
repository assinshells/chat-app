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

// TRUST_PROXY: скільки reverse-proxy стоїть перед бекендом (nginx у prod = 1).
// Без цього req.ip завжди дорівнює IP nginx, і всі IP-ліміти (вхід,
// реєстрація) спільні для всіх користувачів одразу.
function parseTrustProxy(raw) {
  if (raw === undefined || raw === "") return process.env.NODE_ENV === "production" ? 1 : false;
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (/^\d+$/.test(raw)) return Number(raw);
  return raw; // підмережі / ключові слова express: "loopback, 10.0.0.0/8"
}

function assertRequiredEnv() {
  if (captchaEnabled && !process.env.TURNSTILE_SECRET_KEY) {
    throw new Error(
      "CAPTCHA_ENABLED=true, але TURNSTILE_SECRET_KEY не задано. " +
        "Вкажіть ключ у .env або вимкніть CAPTCHA_ENABLED=false (лише для розробки).",
    );
  }
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Відсутні обов'язкові змінні оточення: ${missing.join(", ")}. ` +
        "Перевірте свій файл .env відносно backend/.env.example.",
    );
  }
}

// CAPTCHA за замовчуванням увімкнена в production і вимкнена в dev/test;
// явне CAPTCHA_ENABLED=true|false має пріоритет.
const captchaEnabled =
  process.env.CAPTCHA_ENABLED !== undefined && process.env.CAPTCHA_ENABLED !== ""
    ? process.env.CAPTCHA_ENABLED === "true"
    : process.env.NODE_ENV === "production";

export const env = {
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
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
  // OTP живе 3 хвилини (фронт показує таймер на ті самі 180 с).
  otpTtlSeconds: Number(getEnv("OTP_TTL_SECONDS", 180)),
  // TTL одноразового "verified"-токена, який видається після успішної
  // перевірки OTP і дає змогу встановити новий пароль. Окремий від TTL
  // самого коду, щоб користувач встиг ввести новий пароль.
  otpVerifiedTtlSeconds: Number(getEnv("OTP_VERIFIED_TTL_SECONDS", 600)),
  otpLength: Number(getEnv("OTP_LENGTH", 6)),
  // Максимум невірних спроб введення OTP до його примусової інвалідації.
  // Без цього ліміту OTP (6 цифр) можна підібрати перебором у межах TTL,
  // оскільки express-rate-limit обмежує запити за IP, а не за кодом.
  otpMaxAttempts: Number(getEnv("OTP_MAX_ATTEMPTS", 5)),
  // SMTP для nodemailer (src/adapters/email.adapter.js). Якщо SMTP_HOST
  // не заданий — у development листи не надсилаються, а OTP пишеться в лог.
  smtp: {
    host: getEnv("SMTP_HOST") || undefined,
    port: Number(getEnv("SMTP_PORT", 587)),
    // true — неявний TLS (зазвичай порт 465); false — STARTTLS (587).
    secure: getEnv("SMTP_SECURE", "false") === "true",
    user: getEnv("SMTP_USER") || undefined,
    pass: getEnv("SMTP_PASS") || undefined,
    from: getEnv("SMTP_FROM", '"Балачка" <no-reply@localhost>'),
  },
  rateLimit: {
    loginMax: Number(getEnv("RATE_LIMIT_LOGIN_MAX", 10)),
    registerMax: Number(getEnv("RATE_LIMIT_REGISTER_MAX", 5)),
    forgotMax: Number(getEnv("RATE_LIMIT_FORGOT_MAX", 5)),
    otpMax: Number(getEnv("RATE_LIMIT_OTP_MAX", 10)),
    resetMax: Number(getEnv("RATE_LIMIT_RESET_MAX", 5)),
    refreshMax: Number(getEnv("RATE_LIMIT_REFRESH_MAX", 30)),
    windowMs: Number(getEnv("RATE_LIMIT_WINDOW_MS", 900000)),
  },
  // Тимчасова реєстраційна сесія (між "Увійти" і "В чат").
  registration: {
    sessionTtlSeconds: Number(getEnv("REGISTRATION_SESSION_TTL_SECONDS", 900)),
    // Захист від масового створення реєстраційних сесій з однієї IP.
    startMaxPerIp: Number(getEnv("REGISTRATION_START_MAX_PER_IP", 10)),
    startWindowSeconds: Number(getEnv("REGISTRATION_START_WINDOW_SECONDS", 900)),
  },
  // Підбір пароля до існуючого логіна: окремий від IP-лімітера лічильник
  // по самому логіну (розподілений перебір з багатьох IP).
  loginGuard: {
    maxFailures: Number(getEnv("LOGIN_FAIL_MAX", 10)),
    windowSeconds: Number(getEnv("LOGIN_FAIL_WINDOW_SECONDS", 900)),
  },
  captcha: {
    enabled: captchaEnabled,
    provider: "turnstile",
    secret: getEnv("TURNSTILE_SECRET_KEY") || undefined,
    // Необов'язково: якщо задано, hostname у відповіді Turnstile має збігатися.
    expectedHostname: getEnv("TURNSTILE_EXPECTED_HOSTNAME") || undefined,
    verifyUrl: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    timeoutMs: Number(getEnv("CAPTCHA_TIMEOUT_MS", 5000)),
  },
  // Дефолтний суперадмін, що заводиться/оновлюється автоматично при
  // кожному старті бекенда (див. services/superadminBootstrap.service.js).
  // Не входить у REQUIRED_VARS: без нього застосунок все одно
  // запускається, просто з дефолтними логіном/паролем нижче — їх варто
  // змінити в .env для будь-якого оточення, відкритого назовні.
  superadmin: {
    login: getEnv("SUPERADMIN_LOGIN", "superadmin"),
    password: getEnv("SUPERADMIN_PASSWORD", "ChangeMe123!"),
    email: getEnv("SUPERADMIN_EMAIL") || undefined,
  },
};

export { assertRequiredEnv };
