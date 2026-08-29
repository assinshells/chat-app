export const AUTH_ERRORS = Object.freeze({
  INVALID_CREDENTIALS: "Invalid login or password",
  LOGIN_TAKEN: "Login already taken",
  EMAIL_TAKEN: "Email already taken",
  USER_NOT_FOUND: "User not found",
  OTP_EXPIRED: "OTP expired or not found",
  OTP_INVALID: "Invalid OTP",
  RESET_TOKEN_INVALID: "Reset token expired or invalid",
  UNAUTHORIZED: "Unauthorized",
  ACCESS_TOKEN_INVALID: "Access token missing or invalid",
  REFRESH_TOKEN_INVALID: "Refresh token expired or invalid",
  RATE_LIMIT_EXCEEDED: "Too many requests, please try again later",
  INTERNAL_ERROR: "Internal server error",
  VALIDATION_FAILED: "Validation failed",
  CSRF_TOKEN_INVALID: "Invalid or missing CSRF token",
});

// Cookie names for the httpOnly refresh-token flow. The refresh token
// itself never touches JS (httpOnly); the CSRF token cookie is
// intentionally readable by JS — that's what makes the double-submit
// pattern work (see middlewares/csrf.middleware.js).
export const COOKIE_NAMES = Object.freeze({
  refreshToken: "refreshToken",
  csrfToken: "csrfToken",
});

// Gender is a required registration field with no default value —
// the client must always send one of these explicit values.
// 'unknown' сознательно убран: гендер используется для родовых форм
// системных сообщений (увійшов/увійшла тощо, см. sockets/chat.socket.js),
// а без конкретного значения такое сообщение сформировать нельзя.
export const GENDER_VALUES = Object.freeze({
  MALE: "male",
  FEMALE: "female",
});

export const GENDER_OPTIONS = Object.freeze(Object.values(GENDER_VALUES));

// Цвет сообщений/ника пользователя, выбирается в настройках профиля.
// 'black' — значение по умолчанию (совпадает с DEFAULT в БД).
export const COLOR_VALUES = Object.freeze({
  BLACK: "black",
  BLUE: "blue",
  GREEN: "green",
  PURPLE: "purple",
  ORANGE: "orange",
});

export const COLOR_OPTIONS = Object.freeze(Object.values(COLOR_VALUES));
export const DEFAULT_COLOR = COLOR_VALUES.BLACK;

export const REDIS_KEYS = Object.freeze({
  refreshToken: (jti) => `refresh_token:${jti}`,
  otp: (uid) => `otp:${uid}`,
  otpVerified: (tok) => `otp_verified:${tok}`,
  otpAttempts: (uid) => `otp_attempts:${uid}`,
});

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY: 429,
  INTERNAL: 500,
});