/**
 * AuthSession — тримає accessToken лише в пам'яті вкладки (модульна
 * змінна), НЕ в localStorage/sessionStorage.
 *
 * Раніше тут же зберігався refreshToken — тепер він живе виключно
 * в httpOnly cookie на backend і ніколи не потрапляє в JS (захист від
 * крадіжки токенів через XSS). Наслідок: accessToken втрачається при
 * повному перезавантаженні сторінки, тому App.jsx при монтуванні робить
 * "тихий" запит на /api/auth/refresh — браузер сам додасть httpOnly
 * cookie, і сесія відновиться без участі localStorage.
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
