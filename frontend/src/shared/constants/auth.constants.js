export const AUTH_SCREENS = Object.freeze({
  LOGIN: "login",
  REGISTER: "register",
  FORGOT: "forgot",
  OTP: "otp",
  RESET: "reset",
  APP: "app",
});

export const APP_NAME = "Балачка";

// Обязательное поле при регистрации — значения совпадают с backend GENDER_VALUES.
export const GENDER_OPTIONS = Object.freeze([
  { value: "male", label: "Чоловік" },
  { value: "female", label: "Жінка" },
  { value: "unknown", label: "Не вказувати" },
]);