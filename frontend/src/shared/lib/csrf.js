const CSRF_COOKIE_NAME = "csrfToken";

/**
 * getCsrfToken — читает значение csrfToken cookie напрямую из
 * document.cookie. Cookie сознательно НЕ httpOnly (в отличие от
 * refreshToken) — это и есть double-submit-cookie паттерн: сервер
 * сверяет это значение с заголовком X-CSRF-Token на refresh/logout.
 *
 * Читаем каждый раз из document.cookie, а не кэшируем в памяти —
 * так значение не может рассинхронизироваться с тем, что реально
 * отправит браузер.
 */
export const getCsrfToken = () => {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
};
