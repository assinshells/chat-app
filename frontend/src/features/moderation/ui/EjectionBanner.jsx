/**
 * EjectionBanner — тимчасовий банер "вас видалено з цієї кімнати"
 * (кік або room-бан). На відміну від BannedScreen (глобальний бан,
 * блокує весь чат), тут людину вже автоматично перевели в іншу
 * кімнату (див. useChatSocket forceRejoin) — банер лише пояснює, чому
 * стрічка раптом змінилась, і закривається вручну.
 */
export function EjectionBanner({ ejection, onDismiss }) {
  if (!ejection) return null;

  const title =
    ejection.type === "kicked"
      ? "Вас кикнули з кімнати"
      : "Вас заблоковано в цій кімнаті";

  const expiresLabel =
    ejection.type === "banned"
      ? ejection.expiresAt
        ? ` до ${new Date(ejection.expiresAt).toLocaleString()}`
        : " назавжди"
      : "";

  return (
    <div className="alert alert-warning d-flex align-items-center justify-content-between m-2 mb-0 py-2 px-3">
      <span className="small">
        {title}
        {expiresLabel}
        {ejection.reason ? ` · Причина: ${ejection.reason}` : ""}
      </span>
      <button
        type="button"
        className="btn-close ms-2"
        aria-label="Закрити"
        onClick={onDismiss}
      />
    </div>
  );
}
