export const AUTH_SCREENS = Object.freeze({
  LOGIN: "login",
  REGISTER: "register",
  FORGOT: "forgot",
  OTP: "otp",
  RESET: "reset",
  APP: "app",
});

export const APP_NAME = "Балачка";

// Обов'язкове поле — обирається на формі входу (LoginForm.jsx), не на
// реєстрації. Значення збігаються з backend GENDER_VALUES.
// Текст системних повідомлень (увійшов/вийшов тощо) вже нейтральний і
// не залежить від статі (див. shared/lib/systemMessage.js), тому
// 'unknown' — цілком коректне значення.
export const GENDER_OPTIONS = Object.freeze([
  { value: "male", label: "Чоловік" },
  { value: "female", label: "Жінка" },
  { value: "unknown", label: "Невідомий" },
]);

// Значення статі, обране на формі входу за замовчуванням (перший
// пункт у toggle-групі), доки користувач не обере інше явно.
export const DEFAULT_GENDER = "male";