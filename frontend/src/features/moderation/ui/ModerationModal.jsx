import { createPortal } from "react-dom";

import { ROOMS_BY_ID } from "@features/chat/constants/rooms.constants.js";
import { getColorHex } from "@shared/constants/color.constants.js";
import {
  BAN_DURATION_PRESETS,
  canBanGlobally,
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
 * ModerationModal — єдина на застосунок модалка кіку/бану, відкривається
 * з пункту меню біля ніка (DmTriggerButton), стан — у useModerationStore.
 * room у сторі — та кімната, з меню якої модалку відкрили: саме вона
 * пропонується як ціль кіку і room-бану (кімнату не можна обрати іншу —
 * модератор фізично бачить меню лише поруч з людьми у СВОЇХ кімнатах).
 */
export function ModerationModal({ modalId = "moderationModal" }) {
  const {
    targetLogin,
    targetColor,
    room,
    activeBans,
    loadingBans,
    banScope,
    durationPreset,
    reason,
    kicking,
    banning,
    unbanningId,
    error,
    success,
    setBanScope,
    setDurationPreset,
    setReason,
    clearStatus,
    kick,
    ban,
    unban,
  } = useModerationStore();

  const ownRole = useCurrentUserStore((state) => state.role);
  const canGlobal = canBanGlobally(ownRole);

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
              Модерація
              {targetLogin ? (
                <>
                  {": "}
                  <span
                    style={
                      targetColor && targetColor !== "black"
                        ? { color: getColorHex(targetColor) }
                        : undefined
                    }
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

            <div className="d-flex gap-2 mb-3">
              <button
                type="button"
                className="btn btn-outline-warning rounded-4 fw-bold"
                disabled={kicking}
                onClick={kick}
              >
                {kicking ? "Кикаємо..." : "Кикнути з кімнати"}
              </button>
            </div>

            <hr />

            <p className="mb-2 text-muted small">Забанити</p>

            {canGlobal && (
              <div className="d-flex flex-wrap mb-2">
                <div className="form-check me-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="moderation-ban-scope"
                    id="moderation-scope-room"
                    checked={banScope === "room"}
                    onChange={() => setBanScope("room")}
                  />
                  <label className="form-check-label" htmlFor="moderation-scope-room">
                    Лише ця кімната
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="moderation-ban-scope"
                    id="moderation-scope-global"
                    checked={banScope === "global"}
                    onChange={() => setBanScope("global")}
                  />
                  <label className="form-check-label" htmlFor="moderation-scope-global">
                    Увесь чат (глобально)
                  </label>
                </div>
              </div>
            )}

            <select
              className="form-select mb-2"
              value={durationPreset}
              onChange={(e) => setDurationPreset(e.target.value)}
            >
              {BAN_DURATION_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              className="form-control mb-3"
              placeholder="Причина (необов'язково)"
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <button
              type="button"
              className="btn btn-danger rounded-4 fw-bold mb-3"
              disabled={banning}
              onClick={ban}
            >
              {banning ? "Баним..." : "Забанити"}
            </button>

            {error && <p className="text-danger small mb-3">{error}</p>}
            {success && <p className="text-success small mb-3">{success}</p>}

            <hr />

            <p className="mb-2 text-muted small">Активні бани цього користувача</p>
            {loadingBans ? (
              <p className="text-muted small mb-0">Завантаження...</p>
            ) : activeBans.length === 0 ? (
              <p className="text-muted small mb-0">Немає активних банів</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {activeBans.map((b) => (
                  <li
                    key={b.id}
                    className="d-flex align-items-center justify-content-between mb-2"
                  >
                    <span className="small">
                      {roomLabel(b.room)} · до {formatExpiresAt(b.expiresAt)}
                      {b.reason ? ` · ${b.reason}` : ""}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary rounded-4"
                      disabled={unbanningId === b.id}
                      onClick={() => unban(b.id)}
                    >
                      {unbanningId === b.id ? "..." : "Зняти"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
