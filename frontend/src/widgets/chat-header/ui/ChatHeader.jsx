import { ChevronDown, MessageCircle, Power, User, Users } from "lucide-react";

import { APP_NAME } from "@shared/constants/auth.constants.js";
import { useDmStore } from "@features/dm";
import { useSidePanelStore, SIDE_PANELS } from "@shared/lib/sidePanelStore.js";

/**
 * ChatHeader — шапка чату з трьома кнопками, які відкривають усе
 * "додаткове" поверх/поруч із чатом (постійних колонок і табів нема):
 *
 *  - назва кімнати з ▾ — відкриває вибір кімнати (RoomPickerModal,
 *    id передається в roomPickerModalId, відкриття — штатний
 *    data-bs-toggle="modal");
 *  - "Учасники" + число онлайн — права панель (SidePanel, режим users);
 *  - "Особисті повідомлення" + бейдж непрочитаних — права панель, режим dm;
 *  - "Профіль" — права панель, режим profile (профіль, тема, друзі,
 *    правила);
 *  - "Вийти" (іконка Power) — відкриває модалку підтвердження виходу
 *    (LogoutConfirmModal, id передається в logoutModalId).
 *
 * Яка панель відкрита — у useSidePanelStore; повторний клік по тій
 * самій кнопці закриває панель.
 */
export function ChatHeader({
  title,
  online,
  roomPickerModalId,
  logoutModalId,
  usersCount = 0,
}) {
  const panel = useSidePanelStore((state) => state.panel);
  const togglePanel = useSidePanelStore((state) => state.toggle);

  // Сумарний лічильник непрочитаних особистих повідомлень.
  const dmUnread = useDmStore((state) =>
    Object.values(state.conversations).reduce(
      (sum, convo) => sum + (convo.unreadCount || 0),
      0,
    ),
  );

  const panelButtonClass = (id) =>
    `chat-header-btn ${panel === id ? "is-active" : ""}`;

  return (
    <header className="chat-header">
      <div className="chat-header-inner">
        <div className="chat-header-start">
          <button
            type="button"
            className="chat-room-btn"
            data-bs-toggle="modal"
            data-bs-target={`#${roomPickerModalId}`}
            title="Змінити кімнату"
            aria-label={`Кімната ${title ?? ""}. Змінити кімнату`}
          >
            <span className="chat-brand-info">
              <span className="chat-brand-title">{title || APP_NAME}</span>
              <span
                className={`chat-brand-status ${online ? "is-online" : "is-offline"}`}
              >
                {online ? "Онлайн" : "Підключення…"}
              </span>
            </span>
            <ChevronDown size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="chat-header-actions">
          <button
            type="button"
            className={`${panelButtonClass(SIDE_PANELS.USERS)} chat-header-btn-wide`}
            title="Учасники кімнати"
            aria-label={`Учасники кімнати: ${usersCount}`}
            aria-pressed={panel === SIDE_PANELS.USERS}
            onClick={() => togglePanel(SIDE_PANELS.USERS)}
          >
            <Users size={18} />
            <span className="chat-header-count">{usersCount}</span>
          </button>

          <button
            type="button"
            className={`${panelButtonClass(SIDE_PANELS.DM)} position-relative`}
            title="Особисті повідомлення"
            aria-label="Особисті повідомлення"
            aria-pressed={panel === SIDE_PANELS.DM}
            onClick={() => togglePanel(SIDE_PANELS.DM)}
          >
            <MessageCircle size={18} />
            {dmUnread > 0 && (
              <span className="chat-header-badge badge bg-danger">
                {dmUnread > 99 ? "99+" : dmUnread}
                <span className="visually-hidden">
                  непрочитаних особистих повідомлень
                </span>
              </span>
            )}
          </button>

          <button
            type="button"
            className={panelButtonClass(SIDE_PANELS.PROFILE)}
            title="Профіль"
            aria-label="Профіль"
            aria-pressed={panel === SIDE_PANELS.PROFILE}
            onClick={() => togglePanel(SIDE_PANELS.PROFILE)}
          >
            <User size={18} />
          </button>

          <button
            type="button"
            className="chat-header-btn chat-header-btn-logout"
            data-bs-toggle="modal"
            data-bs-target={`#${logoutModalId}`}
            title="Вийти"
            aria-label="Вийти"
          >
            <Power size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
