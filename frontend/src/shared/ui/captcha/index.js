export { TurnstileWidget } from "./TurnstileWidget.jsx";

// Публічний ключ Turnstile. Якщо не заданий — віджет не показується
// (CAPTCHA вимкнена і на бекенді: CAPTCHA_ENABLED=false).
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";
