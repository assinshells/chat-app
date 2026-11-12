/**
 * SessionReplacedScreen — показується, коли той самий акаунт відкрито
 * в іншому браузері/вкладці і сервер витіснив це з'єднання (одна
 * активна сесія на акаунт, див. backend/src/sockets/singleSession.js).
 */
export function SessionReplacedScreen({ onReclaim, onLogout }) {
  return (
    <div className="d-flex align-items-center justify-content-center vh-100 text-center p-4">
      <div>
        <h4 className="mb-3">Чат відкрито в іншому місці</h4>
        <p className="text-muted mb-3">
          Ваш акаунт увійшов у чат з іншого браузера або вкладки. Одночасно
          можна користуватися чатом лише з одного місця.
        </p>
        <button type="button" className="btn btn-primary fw-bold me-2" onClick={onReclaim}>
          Використовувати тут
        </button>
        {onLogout && (
          <button type="button" className="btn btn-outline-secondary fw-bold" onClick={onLogout}>
            Вийти з акаунту
          </button>
        )}
      </div>
    </div>
  );
}
