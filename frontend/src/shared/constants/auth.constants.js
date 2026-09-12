export const AUTH_SCREENS = Object.freeze({
  LOGIN: "login",
  REGISTER: "register",
  FORGOT: "forgot",
  OTP: "otp",
  RESET: "reset",
  APP: "app",
});

export const APP_NAME = "Балачка";

// Обов'язкове поле — обирається на формі реєстрації (RegisterForm.jsx,
// select). Значення збігаються з backend GENDER_VALUES.
export const GENDER_OPTIONS = Object.freeze([
  { value: "male", label: "Чоловік" },
  { value: "female", label: "Жінка" },
]);

// Значення статі, обране на формі реєстрації за замовчуванням (перший
// пункт у select), доки користувач не обере інше явно.
export const DEFAULT_GENDER = "male";