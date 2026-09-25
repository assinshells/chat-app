export const AUTH_SCREENS = Object.freeze({
  LOGIN: "login",
  REGISTER: "register",
  FORGOT: "forgot",
  OTP: "otp",
  RESET: "reset",
  APP: "app",
});

export const APP_NAME = "Балачка";

// Обов'язкове поле — обирається на формі реєстрації через модалку
// GenderPickerModal.jsx (той самий патерн, що й для кольору —
// ColorPickerModal.jsx / color.constants.js). Значення збігаються з
// backend GENDER_VALUES.
export const GENDER_OPTIONS = Object.freeze([
  { value: "male", label: "Чоловік" },
  { value: "female", label: "Жінка" },
  { value: "unknown", label: "Не вказано" },
]);

// Значення статі, обране на формі реєстрації за замовчуванням, доки
// користувач не обере інше явно через GenderPickerModal.
export const DEFAULT_GENDER = "male";

const GENDER_LABEL_BY_VALUE = Object.fromEntries(
  GENDER_OPTIONS.map((option) => [option.value, option.label]),
);

/**
 * getGenderLabel - назва статі для тригера/підпису в модалці
 * (за аналогією з getColorLabel у color.constants.js).
 */
export const getGenderLabel = (value) =>
  GENDER_LABEL_BY_VALUE[value] ?? GENDER_LABEL_BY_VALUE[DEFAULT_GENDER];