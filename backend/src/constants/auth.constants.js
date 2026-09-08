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

  // Керування ролями (routes/role.routes.js, services/role.service.js).
  ROLE_FORBIDDEN: "Недостатньо прав для цієї дії",
  ROLE_INVALID: "Невірна роль",
  ROLE_ROOMS_REQUIRED: "Потрібно обрати хоча б одну кімнату для модератора",
  ROLE_ROOMS_INVALID: "Невідома кімната серед обраних",
  ROLE_CANNOT_TARGET_SUPERADMIN: "Не можна змінювати роль суперадміністратора",
  ROLE_CANNOT_TARGET_SELF: "Не можна змінювати власну роль",
  ROLE_ADMIN_ONLY_SUPERADMIN: "Лише суперадміністратор може призначати або знімати роль адміністратора",
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
// 'unknown' присутнє в наборі: текст системних повідомлень
// (увійшов/вийшов тощо, див. sockets/chat.socket.js) вже нейтральний
// і не залежить від статі, тому окреме родове узгодження не потрібне.
export const GENDER_VALUES = Object.freeze({
  MALE: "male",
  FEMALE: "female",
  UNKNOWN: "unknown",
});

export const GENDER_OPTIONS = Object.freeze(Object.values(GENDER_VALUES));

// users.gender у БД — NOT NULL без DEFAULT (див. docker/postgres/init.sql),
// тому запис при реєстрації все одно повинен мати якесь значення.
// Стать тепер обирається не на формі реєстрації, а на формі входу
// (RegisterForm.jsx більше не питає її) і одразу після успішного
// першого логіну переписується реальним значенням через
// PATCH /api/auth/gender (див. useLoginStore.js на фронті). Це значення —
// лише тимчасова заглушка на момент INSERT, користувач його не бачить.
export const PROVISIONAL_REGISTER_GENDER = GENDER_VALUES.MALE;

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

// Ролі користувачів. 'user' — значення за замовчуванням (звичайний
// учасник чату, без прав модерації). 'moderator' модерує лише кімнати
// зі свого переліку (moderator_rooms), 'admin' і 'superadmin' — усі
// кімнати без винятку. Рівно один 'superadmin' заводиться автоматично
// при старті бекенда (див. services/superadminBootstrap.service.js) —
// див. коментар там щодо того, чому саме він, а не 'admin', може
// призначати роль 'admin' іншим.
export const ROLE_VALUES = Object.freeze({
  USER: "user",
  MODERATOR: "moderator",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
});

export const ROLE_OPTIONS = Object.freeze(Object.values(ROLE_VALUES));

// Ролі, які можна видати/зняти через API керування ролями (routes/role.routes.js).
// 'user' — це "немає ролі", а не роль, яку хтось "призначає" (див.
// RoleService.removeRole); 'superadmin' в принципі не видається через API —
// існує рівно один, заведений при старті бекенда.
export const ASSIGNABLE_ROLES = Object.freeze([
  ROLE_VALUES.MODERATOR,
  ROLE_VALUES.ADMIN,
]);

// Ролі, яким дозволено керувати ролями інших (POST /api/roles/*).
export const ROLE_MANAGER_ROLES = Object.freeze([
  ROLE_VALUES.ADMIN,
  ROLE_VALUES.SUPERADMIN,
]);

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
