/**
 * AuthSession — держит accessToken только в памяти вкладки (модульная
 * переменная), НЕ в localStorage/sessionStorage.
 *
 * Раньше здесь же хранился refreshToken — теперь он живёт исключительно
 * в httpOnly cookie на backend и никогда не попадает в JS (защита от
 * кражи токенов через XSS). Следствие: accessToken теряется при полной
 * перезагрузке страницы, поэтому App.jsx при монтировании делает
 * "тихий" запрос на /api/auth/refresh — браузер сам приложит httpOnly
 * cookie, и сессия восстановится без участия localStorage.
 */
let accessToken = null;

export const AuthSession = {
  getAccessToken() {
    return accessToken;
  },

  setAccessToken(token) {
    accessToken = token;
  },

  clear() {
    accessToken = null;
  },

  hasSession() {
    return Boolean(accessToken);
  },
};
