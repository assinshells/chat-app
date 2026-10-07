import { useEffect } from "react";
import { ChevronDown, Images, MessageCircle, User, Users } from "lucide-react";

import { APP_NAME } from "@shared/constants/auth.constants.js";
import { useDmStore } from "@features/dm";
import { useSidePanelStore, SIDE_PANELS } from "@shared/lib/sidePanelStore.js";
import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { useGalleryReviewStore } from "@shared/lib/galleryReviewStore.js";

/**
 * ChatHeader — шапка чату з кнопками, які відкривають усе
 * "додаткове" поверх/поруч із чатом (постійних колонок і табів нема):
 *
 *  - крапка статусу з'єднання (.chat-status-dot: зелена — онлайн, жовта
 *    пульсуюча — підключення) + назва кімнати з ▾ — відкриває вибір кімнати (RoomPickerModal,
 *    id передається в roomPickerModalId, відкриття — штатний
 *    data-bs-toggle="modal");
 *  - "Учасники" + число онлайн — права панель (SidePanel, режим users);
 *  - "Особисті повідомлення" + бейдж непрочитаних — права панель, режим dm;

 *  - "Фотогалерея" — права панель, режим gallery (фото всіх користувачів
 *    після перевірки); у того, хто перевіряє фото, на іконці — бейдж із
 *    кількістю непроверених;
 *  - "Профіль" — права панель, режим profile (профіль, тема, друзі,
 *    інформація, вихід);
 *
 * Яка панель відкрита — у useSidePanelStore; повторний клік по тій
 * самій кнопці закриває панель.
 */
export function ChatHeader({
  title,
  online,
  roomPickerModalId,
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

  // Бейдж "чекає перевірки" — лише для тих, хто перевіряє. Оновлюємо при
  // монтуванні та щоразу, як галерею відкрили/закрили (дешевий запит).
  const canReviewPhotos = useCurrentUserStore((state) => state.canReviewPhotos);
  const pendingPhotos = useGalleryReviewStore((state) => state.pendingCount);
  const refreshPendingPhotos = useGalleryReviewStore((state) => state.refresh);
  const isGalleryOpen = panel === SIDE_PANELS.GALLERY;

  useEffect(() => {
    if (canReviewPhotos) refreshPendingPhotos();
  }, [canReviewPhotos, isGalleryOpen, refreshPendingPhotos]);

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
            title={`Змінити кімнату · ${online ? "Онлайн" : "Підключення…"}`}
            aria-label={`Кімната ${title ?? ""}. ${
              online ? "Онлайн" : "Підключення…"
            }. Змінити кімнату`}
          >
            <span
              className={`chat-status-dot ${online ? "is-online" : "is-offline"}`}
              aria-hidden="true"
            />
            <span className="chat-brand-info">
              <span className="chat-brand-title">{title || APP_NAME}</span>
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
            className={`${panelButtonClass(SIDE_PANELS.GALLERY)} position-relative`}
            title="Фотогалерея"
            aria-label="Фотогалерея"
            aria-pressed={isGalleryOpen}
            onClick={() => togglePanel(SIDE_PANELS.GALLERY)}
          >
            <Images size={18} />
            {canReviewPhotos && pendingPhotos > 0 && (
              <span className="chat-header-badge badge bg-danger">
                {pendingPhotos > 99 ? "99+" : pendingPhotos}
                <span className="visually-hidden">фото очікують перевірки</span>
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

        </div>
      </div>
    </header>
  );
}
