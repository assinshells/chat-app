/**
 * BannedScreen — показується ЗАМІСТЬ усього чату, коли поточний
 * користувач має активний ГЛОБАЛЬНИЙ бан (room-специфічні бани лише
 * закривають конкретну кімнату — див. EjectionBanner). Джерело даних —
 * banInfo з useChatSocket: або з connect_error (бан уже діяв до
 * спроби підключення), або з живої події moderation:banned (бан видали
 * просто зараз, поки людина була онлайн).
 */
export function BannedScreen({ banInfo, onLogout }) {
  const expiresLabel = banInfo?.expiresAt
    ? new Date(banInfo.expiresAt).toLocaleString()
    : "безстроково";

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 text-center p-4">
      <div>
        <h4 className="mb-3">Доступ до чату обмежено</h4>
        <p className="text-muted mb-1">Термін: {expiresLabel}</p>
        {banInfo?.reason && (
          <p className="text-muted mb-3">Причина: {banInfo.reason}</p>
        )}
        {onLogout && (
          <button
            type="button"
            className="btn btn-outline-secondary rounded-4 fw-bold mt-2"
            onClick={onLogout}
          >
            Вийти з акаунту
          </button>
        )}
      </div>
    </div>
  );
}
