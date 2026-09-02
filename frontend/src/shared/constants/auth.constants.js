export const AUTH_SCREENS = Object.freeze({
  LOGIN: "login",
  REGISTER: "register",
  FORGOT: "forgot",
  OTP: "otp",
  RESET: "reset",
  APP: "app",
});

export const APP_NAME = "Балачка";

// Обов'язкове поле при реєстрації — значення збігаються з backend GENDER_VALUES.
// 'unknown' свідомо не входить у набір: стать потрібна для родових
// форм системних повідомлень (увійшов/увійшла тощо, див. shared/lib/systemMessage.js).
export const GENDER_OPTIONS = Object.freeze([
  { value: "male", label: "Чоловік" },
  { value: "female", label: "Жінка" },
]);