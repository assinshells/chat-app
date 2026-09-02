const CSRF_COOKIE_NAME = "csrfToken";

/**
 * getCsrfToken — читає значення csrfToken cookie напряму з
 * document.cookie. Cookie свідомо НЕ httpOnly (на відміну від
 * refreshToken) — це і є double-submit-cookie патерн: сервер
 * звіряє це значення із заголовком X-CSRF-Token на refresh/logout.
 *
 * Читаємо кожного разу з document.cookie, а не кешуємо в пам'яті —
 * так значення не може розсинхронізуватися з тим, що реально
 * надішле браузер.
 */
export const getCsrfToken = () => {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
};
