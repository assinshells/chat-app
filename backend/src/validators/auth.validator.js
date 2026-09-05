import { ValidationException } from "../exceptions/auth.exceptions.js";
import { GENDER_OPTIONS, COLOR_OPTIONS } from "../constants/auth.constants.js";

// Максимальна довжина нікнейма при реєстрації. users.login у БД —
// VARCHAR(64) (див. docker/postgres/init.sql), тобто технічно влізе й
// довше, але продуктове обмеження — 20 символів (узгоджено з фронтом,
// див. RegisterForm.jsx, maxLength на полі нікнейма).
export const MAX_LOGIN_LENGTH = 20;

const isNonEmptyString = (val) =>
  typeof val === "string" && val.trim().length > 0;
const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
const isValidPassword = (val) => typeof val === "string" && val.length >= 6;
const isValidGender = (val) =>
  typeof val === "string" && GENDER_OPTIONS.includes(val);
const isValidColor = (val) =>
  typeof val === "string" && COLOR_OPTIONS.includes(val);

export const validateLoginRequest = (body) => {
  const errors = [];
  if (!isNonEmptyString(body.login)) errors.push("логін обов'язковий");
  if (!isValidPassword(body.password))
    errors.push("пароль має містити щонайменше 6 символів");
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

export const validateRegisterRequest = (body) => {
  const errors = [];
  if (!isNonEmptyString(body.login)) errors.push("логін обов'язковий");
  else if (body.login.trim().length > MAX_LOGIN_LENGTH)
    errors.push(`нікнейм має бути не довшим за ${MAX_LOGIN_LENGTH} символів`);
  if (!isValidPassword(body.password))
    errors.push("пароль має містити щонайменше 6 символів");
  if (body.email && !isValidEmail(body.email)) errors.push("email недійсний");
  if (!isValidGender(body.gender))
    errors.push(`стать обов'язкова і має бути однією з: ${GENDER_OPTIONS.join(", ")}`);
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
