import { COOKIE_NAMES, AUTH_ERRORS } from "../constants/auth.constants.js";
import { AuthorizationException } from "../exceptions/auth.exceptions.js";

/**
 * csrfProtection — CSRF-захист за схемою double-submit-cookie.
 *
 * Працює разом з CookieProvider: при login/refresh сервер виставляє
 * непрозорий csrfToken одночасно як cookie (доступну для читання JS) і
 * очікує отримати те саме значення назад у заголовку X-CSRF-Token. Сторонній
 * сайт може змусити браузер жертви надіслати cookie (це і є CSRF),
 * але не може прочитати її значення і підставити в заголовок — same-origin
 * policy не дає читати document.cookie чужого origin.
 *
 * Якщо cookie відсутня — значить немає активної cookie-based сесії,
 * яку потрібно захищати (наприклад logout без попереднього login),
 * тому пропускаємо: цьому запиту нема чого підробляти.
 */
export const csrfProtection = (req, _res, next) => {
  const cookieToken = req.cookies?.[COOKIE_NAMES.csrfToken];
  if (!cookieToken) return next();

  const headerToken = req.get("X-CSRF-Token");
  if (!headerToken || headerToken !== cookieToken) {
    return next(new AuthorizationException(AUTH_ERRORS.CSRF_TOKEN_INVALID));
  }

  next();
};
