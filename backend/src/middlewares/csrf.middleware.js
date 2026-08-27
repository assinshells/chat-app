import { COOKIE_NAMES, AUTH_ERRORS } from "../constants/auth.constants.js";
import { AuthorizationException } from "../exceptions/auth.exceptions.js";

/**
 * csrfProtection — double-submit-cookie CSRF защита.
 *
 * Работает вместе с CookieProvider: при login/refresh сервер выставляет
 * непрозрачный csrfToken одновременно как cookie (читаемую JS) и ожидает
 * получить то же значение обратно в заголовке X-CSRF-Token. Сторонний
 * сайт может заставить браузер жертвы отправить cookie (это и есть CSRF),
 * но не может прочитать её значение и подставить в заголовок — same-origin
 * policy не даёт читать document.cookie чужого origin.
 *
 * Если cookie отсутствует — значит нет активной cookie-based сессии,
 * которую нужно защищать (например logout без предварительного login),
 * поэтому пропускаем: этому запросу нечего подделывать.
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
