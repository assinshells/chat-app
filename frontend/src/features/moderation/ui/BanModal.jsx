import { createPortal } from "react-dom";

import { ROOMS_BY_ID } from "@features/chat/constants/rooms.constants.js";
import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";
import {
  BAN_DURATION_PRESETS,
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
 * BanModal — пункт меню "Бан". Дві кнопки:
 *  - "Бан кімнати" — банить одразу в УСІХ кімнатах, де актор
 *    модерує, і переносить жертву в bespredel; звідти вона може
 *    переходити в будь-яку ІНШУ (незабанену) кімнату (banRoom);
 *  - "Бан чату" — повний бан усього чату, може бути "назавжди"
 *    (banChat, той самий механізм, що й старий глобальний бан).
 * Модератор бачить фіксований дефолт (10 хв), без "назавжди".
 * Admin/superadmin можуть обрати тривалість (включно з "Назавжди").
 */
export function BanModal({ modalId = "banModerationModal" }) {
  const {
    targetLogin,
    targetColor,
    room,
    activeBans,
    loadingStatus,
    banRoomMs,
    banChatMs,
    banRoomPermanent,
    banChatPermanent,
    reason,
    banningRoom,
    banningChat,
    unbanningId,
    error,
    success,
    setBanRoomMs,
    setBanChatMs,
    setBanRoomPermanent,
    setBanChatPermanent,
    setReason,
    clearStatus,
    banRoom,
    banChat,
    unban,
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
      data-bs-backdrop="static"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content settings-modal">
          <div className="modal-header">
            <h5 className="modal-title" id={`${modalId}Label`}>
              Бан
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
              Кімната меню: <strong>{roomLabel(room)}</strong>
            </p>

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
                Бан кімнати (виштовхне в «Бєспрєдєл» і забанить у всіх
                кімнатах, де ви модеруєте; з «Бєспрєдєл» можна перейти в
                інші, незабанені кімнати)
              </p>
              {canCustomize ? (
                <>
                  <select
                    className="form-select mb-2"
                    value={banRoomPermanent ? "permanent" : banRoomMs}
                    onChange={(e) => {
                      if (e.target.value === "permanent") {
                        setBanRoomPermanent(true);
                      } else {
                        setBanRoomPermanent(false);
                        setBanRoomMs(Number(e.target.value));
                      }
                    }}
                  >
                    {BAN_DURATION_PRESETS.map((preset) => (
                      <option
                        key={preset.value}
                        value={preset.ms === null ? "permanent" : preset.ms}
                      >
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <p className="text-muted small mb-2">
                  Тривалість: {DEFAULT_MODERATOR_DURATION_LABEL} (фіксовано)
                </p>
              )}
              <button
                type="button"
                className="btn btn-outline-danger rounded-4 fw-bold"
                disabled={banningRoom}
                onClick={() => banRoom()}
              >
                {banningRoom ? "Баним..." : "Бан кімнати"}
              </button>
            </div>

            <hr />

            <div className="mb-3">
              <p className="mb-2 text-muted small">
                Бан чату (повністю блокує доступ до чату)
              </p>
              {canCustomize ? (
                <select
                  className="form-select mb-2"
                  value={banChatPermanent ? "permanent" : banChatMs}
                  onChange={(e) => {
                    if (e.target.value === "permanent") {
                      setBanChatPermanent(true);
                    } else {
                      setBanChatPermanent(false);
                      setBanChatMs(Number(e.target.value));
                    }
                  }}
                >
                  {BAN_DURATION_PRESETS.map((preset) => (
                    <option
                      key={preset.value}
                      value={preset.ms === null ? "permanent" : preset.ms}
                    >
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
                className="btn btn-danger rounded-4 fw-bold"
                disabled={banningChat}
                onClick={() => banChat()}
              >
                {banningChat ? "Баним..." : "Бан чату"}
              </button>
            </div>

            {error && <p className="text-danger small mb-3">{error}</p>}
            {success && <p className="text-success small mb-3">{success}</p>}

            <hr />

            <p className="mb-2 text-muted small">Активні бани цього користувача</p>
            {loadingStatus ? (
              <p className="text-muted small mb-0">Завантаження...</p>
            ) : activeBans.length === 0 ? (
              <p className="text-muted small mb-0">Немає активних банів</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {activeBans.map((b) => (
                  <li
                    key={`${b.id ?? "pending"}-${b.room ?? "global"}`}
                    className="d-flex align-items-center justify-content-between mb-2"
                  >
                    <span className="small">
                      {roomLabel(b.room)} · до {formatExpiresAt(b.expiresAt)}
                      {b.reason ? ` · ${b.reason}` : ""}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary rounded-4"
                      disabled={!b.id || unbanningId === b.id}
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
