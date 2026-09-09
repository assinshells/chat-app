import { createPortal } from "react-dom";

import { ROOMS_BY_ID } from "@features/chat/constants/rooms.constants.js";
import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";
import {
  KICK_DURATION_PRESETS,
  KICK_CHAT_DURATION_PRESETS,
  DEFAULT_MODERATOR_DURATION_LABEL,
  canSetCustomDuration,
} from "@shared/constants/moderationAction.constants.js";
import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { useModerationStore } from "@features/moderation/model/useModerationStore.js";

function formatExpiresAt(expiresAt) {
  if (!expiresAt) return "назавжди";
  return new Date(expiresAt).toLocaleString();
}

function roomLabel(room) {
  return room ? ROOMS_BY_ID[room]?.name ?? room : "усі кімнати (глобально)";
}

/**
 * KickModal — пункт меню "Кикнути". Дві кнопки:
 *  - "В беспредел" — замикає в bespredel, не можна переходити по
 *    кімнатах (kickToBespredel);
 *  - "Із чату" — тимчасово повністю вилучає з чату, не можна зайти
 *    взагалі (kickFromChat).
 * Модератор бачить лише кнопки з фіксованим дефолтом (10 хв, підпис
 * під кнопкою) — без вибору тривалості. Admin/superadmin додатково
 * бачать select із пресетами тривалості для кожної кнопки.
 */
export function KickModal({ modalId = "kickModerationModal" }) {
  const {
    targetLogin,
    targetColor,
    room,
    confinement,
    kickBespredelMs,
    kickChatMs,
    reason,
    kickingBespredel,
    kickingChat,
    releasing,
    error,
    success,
    setKickBespredelMs,
    setKickChatMs,
    setReason,
    clearStatus,
    kickToBespredel,
    kickFromChat,
    releaseConfinement,
  } = useModerationStore();

  const ownRole = useCurrentUserStore((state) => state.role);
  const canCustomize = canSetCustomDuration(ownRole);

  // Тема — щоб нік у заголовку модалки рендерився правильним відтінком
  // кольору цілі (див. getEffectiveColorHex у ChatConversation.jsx).
  const isDarkTheme = useIsDarkTheme();

  return createPortal(
    <div
      className="modal fade"
      id={modalId}
      tabIndex="-1"
      aria-labelledby={`${modalId}Label`}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content settings-modal">
          <div className="modal-header">
            <h5 className="modal-title" id={`${modalId}Label`}>
              Кикнути
              {targetLogin ? (
                <>
                  {": "}
                  <span
                    style={{ color: getEffectiveColorHex(targetColor, isDarkTheme) }}
                  >
                    {targetLogin}
                  </span>
                </>
              ) : null}
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Закрити"
              onClick={clearStatus}
            />
          </div>

          <div className="modal-body">
            <p className="mb-3 text-muted small">
              Кімната: <strong>{roomLabel(room)}</strong>
            </p>

            {confinement && (
              <div className="alert alert-warning py-2 px-3 small mb-3">
                Зараз замкнений у «{roomLabel(confinement.confinedRoom)}» до{" "}
                {formatExpiresAt(confinement.expiresAt)}
                {confinement.reason ? ` · ${confinement.reason}` : ""}
                <div className="mt-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-4"
                    disabled={releasing}
                    onClick={releaseConfinement}
                  >
                    {releasing ? "..." : "Звільнити достроково"}
                  </button>
                </div>
              </div>
            )}

            <input
              type="text"
              className="form-control mb-3"
              placeholder="Причина (необов'язково)"
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <div className="mb-3">
              <p className="mb-2 text-muted small">
                В беспредел (замкне в «Бєспрєдєл», без можливості перейти в
                інші кімнати)
              </p>
              {canCustomize ? (
                <select
                  className="form-select mb-2"
                  value={kickBespredelMs}
                  onChange={(e) => setKickBespredelMs(Number(e.target.value))}
                >
                  {KICK_DURATION_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.ms}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-muted small mb-2">
                  Тривалість: {DEFAULT_MODERATOR_DURATION_LABEL} (фіксовано)
                </p>
              )}
              <button
                type="button"
                className="btn btn-outline-warning rounded-4 fw-bold"
                disabled={kickingBespredel}
                onClick={() => kickToBespredel()}
              >
                {kickingBespredel ? "Кикаємо..." : "В беспредел"}
              </button>
            </div>

            <hr />

            <div className="mb-2">
              <p className="mb-2 text-muted small">
                Із чату (тимчасово не зможе зайти в чат взагалі)
              </p>
              {canCustomize ? (
                <select
                  className="form-select mb-2"
                  value={kickChatMs}
                  onChange={(e) => setKickChatMs(Number(e.target.value))}
                >
                  {KICK_CHAT_DURATION_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.ms}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-muted small mb-2">
                  Тривалість: {DEFAULT_MODERATOR_DURATION_LABEL} (фіксовано)
                </p>
              )}
              <button
                type="button"
                className="btn btn-outline-danger rounded-4 fw-bold"
                disabled={kickingChat}
                onClick={() => kickFromChat()}
              >
                {kickingChat ? "Кикаємо..." : "Із чату"}
              </button>
            </div>

            {error && <p className="text-danger small mb-0 mt-3">{error}</p>}
            {success && <p className="text-success small mb-0 mt-3">{success}</p>}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
