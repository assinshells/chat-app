export const AUTH_ERRORS = Object.freeze({
  INVALID_CREDENTIALS: "Невірний логін або пароль",
  LOGIN_TAKEN: "Цей логін вже зайнято",
  EMAIL_TAKEN: "Ця email-адреса вже зайнята",
  USER_NOT_FOUND: "Користувача не знайдено",
  OTP_EXPIRED: "Код OTP прострочено або не знайдено",
  OTP_INVALID: "Невірний код OTP",
  RESET_TOKEN_INVALID: "Токен скидання прострочено або недійсний",
  UNAUTHORIZED: "Не авторизовано",
  ACCESS_TOKEN_INVALID: "Токен доступу відсутній або недійсний",
  REFRESH_TOKEN_INVALID: "Токен оновлення прострочено або недійсний",
  RATE_LIMIT_EXCEEDED: "Забагато запитів, спробуйте пізніше",
  INTERNAL_ERROR: "Внутрішня помилка сервера",
  VALIDATION_FAILED: "Помилка валідації",
  CSRF_TOKEN_INVALID: "Невірний або відсутній CSRF-токен",
});

// Назви cookie для httpOnly-потоку refresh-токена. Сам refresh-токен
// ніколи не торкається JS (httpOnly); cookie з CSRF-токеном
// навмисно доступна для читання з JS — саме це і робить можливим
// double-submit-патерн (див. middlewares/csrf.middleware.js).
export const COOKIE_NAMES = Object.freeze({
  refreshToken: "refreshToken",
  csrfToken: "csrfToken",
});

// Стать — обов'язкове поле реєстрації без значення за замовчуванням —
// клієнт завжди повинен надіслати одне з цих явних значень.
// 'unknown' свідомо прибрано: стать використовується для родових форм
// системних повідомлень (увійшов/увійшла тощо, див. sockets/chat.socket.js),
// а без конкретного значення таке повідомлення сформувати не можна.
export const GENDER_VALUES = Object.freeze({
  MALE: "male",
  FEMALE: "female",
});

export const GENDER_OPTIONS = Object.freeze(Object.values(GENDER_VALUES));

// Колір повідомлень/ніка користувача, обирається в налаштуваннях профілю.
// 'black' — значення за замовчуванням (збігається з DEFAULT у БД).
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
