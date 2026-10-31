import { ValidationException } from "../exceptions/auth.exceptions.js";
import {
  AUTH_ERRORS,
  GENDER_OPTIONS,
  COLOR_OPTIONS,
  STATUS_OPTIONS,
  MARITAL_STATUS_OPTIONS,
} from "../constants/auth.constants.js";

// Максимальна довжина нікнейма при реєстрації. users.login у БД —
// VARCHAR(64) (див. docker/postgres/init.sql), тобто технічно влізе й
// довше, але продуктове обмеження — 20 символів (узгоджено з фронтом,
// див. RegisterForm.jsx, maxLength на полі нікнейма).
export const MAX_LOGIN_LENGTH = 20;

// Мінімальна довжина нікнейма при реєстрації (узгоджено з фронтом,
// див. RegisterForm.jsx, minLength/підказка під полем нікнейма).
export const MIN_LOGIN_LENGTH = 3;

const isNonEmptyString = (val) =>
  typeof val === "string" && val.trim().length > 0;
const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
const isValidPassword = (val) => typeof val === "string" && val.length >= 6;
const isValidGender = (val) =>
  typeof val === "string" && GENDER_OPTIONS.includes(val);
const isValidColor = (val) =>
  typeof val === "string" && COLOR_OPTIONS.includes(val);
const isValidStatus = (val) =>
  typeof val === "string" && STATUS_OPTIONS.includes(val);

export const validateLoginRequest = (body) => {
  const errors = [];
  if (!isNonEmptyString(body.login)) errors.push("логін обов'язковий");
  if (!isValidPassword(body.password))
    errors.push("пароль має містити щонайменше 6 символів");
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

// Максимальна довжина пароля нового акаунта: scrypt не залежить від
// довжини, але розумна межа відсікає сміття й гігантські тіла запитів.
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_EMAIL_LENGTH = 255; // users.email VARCHAR(255)

/**
 * Правила для НОВОГО акаунта (логін, якого ще немає в БД). До існуючих
 * користувачів вони не застосовуються: у старих записів логін/пароль
 * могли бути створені за іншими правилами, і вхід не повинен їх ламати.
 * Викликається з AuthFlowService лише у гілці "логін не знайдено".
 */
export const validateNewAccountCredentials = ({ login, password }) => {
  const errors = [];
  if (login !== login.trim())
    errors.push("нікнейм не може починатися чи закінчуватися пробілом");
  else if (login.length < MIN_LOGIN_LENGTH)
    errors.push(`нікнейм має бути не коротшим за ${MIN_LOGIN_LENGTH} символи`);
  else if (login.length > MAX_LOGIN_LENGTH)
    errors.push(`нікнейм має бути не довшим за ${MAX_LOGIN_LENGTH} символів`);
  if (password.length > MAX_PASSWORD_LENGTH)
    errors.push(`пароль має бути не довшим за ${MAX_PASSWORD_LENGTH} символів`);
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

/**
 * Тіло POST /api/auth/register (завершення реєстрації): логін і пароль
 * сюди НЕ приходять — вони беруться із серверної реєстраційної сесії.
 *  - noEmail: true  -> email не потрібен (ігнорується, якщо переданий);
 *  - noEmail: false -> email обов'язковий і має бути коректним.
 */
export const validateCompleteRegistrationRequest = (body) => {
  const errors = [];
  if (typeof body?.noEmail !== "boolean")
    errors.push("noEmail має бути true або false");
  else if (body.noEmail === false) {
    if (!isNonEmptyString(body.email)) errors.push(AUTH_ERRORS.EMAIL_REQUIRED);
    else if (
      body.email.trim().length > MAX_EMAIL_LENGTH ||
      !isValidEmail(body.email.trim())
    )
      errors.push("email недійсний");
  }
  if (
    body?.captchaToken !== undefined &&
    typeof body.captchaToken !== "string"
  )
    errors.push("некоректний токен перевірки");
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

export const validateForgotPasswordRequest = (body) => {
  const errors = [];
  if (!body.email || !isValidEmail(body.email))
    errors.push("потрібна дійсна email-адреса");
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

export const validateVerifyOtpRequest = (body) => {
  const errors = [];
  if (!body.email || !isValidEmail(body.email))
    errors.push("потрібна дійсна email-адреса");
  if (!isNonEmptyString(body.otpCode)) errors.push("otpCode обов'язковий");
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

export const validateResetPasswordRequest = (body) => {
  const errors = [];
  if (!isNonEmptyString(body.verifiedToken))
    errors.push("verifiedToken обов'язковий");
  if (!isValidPassword(body.password))
    errors.push("пароль має містити щонайменше 6 символів");
  if (!isNonEmptyString(body.confirmPassword))
    errors.push("підтвердження пароля обов'язкове");
  if (body.password !== body.confirmPassword)
    errors.push("Паролі не збігаються");
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

export const validateConfirmPasswordChangeRequest = (body) => {
  const errors = [];
  if (!isNonEmptyString(body.otpCode)) errors.push("otpCode обов'язковий");
  if (!isValidPassword(body.password))
    errors.push("пароль має містити щонайменше 6 символів");
  if (!isNonEmptyString(body.confirmPassword))
    errors.push("підтвердження пароля обов'язкове");
  if (body.password !== body.confirmPassword)
    errors.push("Паролі не збігаються");
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

export const validateUpdateGenderRequest = (body) => {
  const errors = [];
  if (!isValidGender(body.gender))
    errors.push(`стать обов'язкова і має бути однією з: ${GENDER_OPTIONS.join(", ")}`);
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

export const validateUpdateColorRequest = (body) => {
  const errors = [];
  if (!isValidColor(body.color))
    errors.push(`колір обов'язковий і має бути одним із: ${COLOR_OPTIONS.join(", ")}`);
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

export const validateUpdateTextStyleRequest = (body) => {
  const errors = [];
  const isBoolOrUndef = (v) => v === undefined || typeof v === "boolean";
  if (!isBoolOrUndef(body?.bold)) errors.push("bold має бути true або false");
  if (!isBoolOrUndef(body?.italic)) errors.push("italic має бути true або false");
  if (body?.bold === undefined && body?.italic === undefined)
    errors.push("потрібно передати bold та/або italic");
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

export const validateUpdateStatusRequest = (body) => {
  const errors = [];
  if (!isValidStatus(body.status))
    errors.push(`статус обов'язковий і має бути одним із: ${STATUS_OPTIONS.join(", ")}`);
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

// Максимальна довжина міста. users.city у БД — VARCHAR(120)
// (див. docker/postgres/init.sql), обмеження узгоджене з фронтом
// (EditableProfileField, maxLength на полі "Місто").
export const MAX_CITY_LENGTH = 120;

export const validateUpdateEmailRequest = (body) => {
  const errors = [];
  if (!isNonEmptyString(body.email) || !isValidEmail(body.email.trim()))
    errors.push("потрібна дійсна email-адреса");
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

export const validateUpdateCityRequest = (body) => {
  const errors = [];
  // Місто необов'язкове — порожній рядок допустимий (означає "очистити
  // поле", див. toUpdateCityDto), тому валідується лише тип і довжина.
  if (typeof body.city !== "string") errors.push("місто має бути рядком");
  else if (body.city.trim().length > MAX_CITY_LENGTH)
    errors.push(`назва міста має бути не довшою за ${MAX_CITY_LENGTH} символів`);
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

// Максимальна довжина відображуваного імені, узгоджена з
// users.display_name VARCHAR(120) у БД.
export const MAX_DISPLAY_NAME_LENGTH = 120;

export const validateUpdateDisplayNameRequest = (body) => {
  const errors = [];
  // Так само необов'язкове, як і city — порожній рядок допустимий.
  if (typeof body.displayName !== "string")
    errors.push("ім'я має бути рядком");
  else if (body.displayName.trim().length > MAX_DISPLAY_NAME_LENGTH)
    errors.push(`ім'я має бути не довшим за ${MAX_DISPLAY_NAME_LENGTH} символів`);
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

// Максимальна довжина "Про себе", узгоджена з users.about VARCHAR(500)
// у БД (та EditableProfileField, maxLength на textarea).
export const MAX_ABOUT_LENGTH = 500;

export const validateUpdateAboutRequest = (body) => {
  const errors = [];
  // Так само необов'язкове, як і city/displayName — порожній рядок
  // допустимий (означає "очистити поле").
  if (typeof body.about !== "string") errors.push("поле «Про себе» має бути рядком");
  else if (body.about.trim().length > MAX_ABOUT_LENGTH)
    errors.push(`поле «Про себе» має бути не довшим за ${MAX_ABOUT_LENGTH} символів`);
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

export const validateUpdateMaritalStatusRequest = (body) => {
  const errors = [];
  // Порожній рядок допустимий (означає "очистити поле").
  if (
    typeof body.maritalStatus !== "string" ||
    (body.maritalStatus !== "" &&
      !MARITAL_STATUS_OPTIONS.includes(body.maritalStatus))
  )
    errors.push(
      `сімейний стан має бути порожнім або одним із: ${MARITAL_STATUS_OPTIONS.join(", ")}`,
    );
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

export const validateProfileLoginParam = (login) => {
  if (
    typeof login !== "string" ||
    login.length < MIN_LOGIN_LENGTH ||
    login.length > MAX_LOGIN_LENGTH
  )
    throw new ValidationException("Помилка валідації", ["некоректний нікнейм"]);
};
