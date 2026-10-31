export const AUTH_SCREENS = Object.freeze({
  LOGIN: "login",
  // Другий крок єдиного потоку входу (замість окремої сторінки реєстрації).
  COMPLETE_REGISTRATION: "complete-registration",
  FORGOT: "forgot",
  OTP: "otp",
  RESET: "reset",
  APP: "app",
});

export const APP_NAME = "Балачка";

// Значення збігаються з backend GENDER_VALUES. На реєстрації стать більше
// не обирається: новий акаунт отримує "unknown" (backend NEW_USER_DEFAULTS).
export const GENDER_OPTIONS = Object.freeze([
  { value: "male", label: "Чоловік" },
  { value: "female", label: "Жінка" },
  { value: "unknown", label: "Невідомо" },
]);

// Стать за замовчуванням для відображення, якщо значення не прийшло.
export const DEFAULT_GENDER = "unknown";

const GENDER_LABEL_BY_VALUE = Object.fromEntries(
  GENDER_OPTIONS.map((option) => [option.value, option.label]),
);

/**
 * getGenderLabel - назва статі для тригера/підпису в модалці
 * (за аналогією з getColorLabel у color.constants.js).
 */
export const getGenderLabel = (value) =>
  GENDER_LABEL_BY_VALUE[value] ?? GENDER_LABEL_BY_VALUE[DEFAULT_GENDER];

// Параметри одноразового коду (мають збігатися з бекендом:
// OTP_LENGTH і OTP_TTL_SECONDS у backend/.env).
export const OTP_LENGTH = 6;
export const OTP_TTL_SECONDS = 180;
// Через скільки секунд після відправки можна запросити код повторно.
export const OTP_RESEND_COOLDOWN_SECONDS = 30;
