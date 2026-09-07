/**
 * ConfinementBanner — показується, ПОКИ діє кік-обмеження (див.
 * useChatSocket.confinement): користувача вже перевели в confinedRoom
 * (зазвичай "Бєспрєдєл") і сервер відхилятиме будь-яку спробу перейти
 * в іншу кімнату до expiresAt. На відміну від старого підходу
 * "виштовхнули в іншу кімнату і одразу можна повернутися", тут
 * обмеження реальне — банер лише пояснює, чому сайдбар "не пускає"
 * в інші кімнати, і не приховується вручну (це не просто сповіщення,
 * а стан, що триває).
 */
export function ConfinementBanner({ confinement }) {
  if (!confinement) return null;

  const expiresLabel = confinement.expiresAt
    ? new Date(confinement.expiresAt).toLocaleTimeString()
    : null;

  return (
    <div className="alert alert-warning m-2 mb-0 py-2 px-3">
      <span className="small">
        Вас тимчасово обмежено цією кімнатою
        {expiresLabel ? ` до ${expiresLabel}` : ""}
        {confinement.reason ? ` · Причина: ${confinement.reason}` : ""}. Перехід в
        інші кімнати недоступний.
      </span>
    </div>
  );
}
