import { Mail, PanelLeft } from "lucide-react";

import { APP_NAME } from "@shared/constants/auth.constants.js";
import { useDmStore } from "@features/dm";

export function ChatHeader({
  title,
  online,
  sidebarCollapsed,
  onOpenSidebar,
  onHoverSidebarIcon,
  onOpenMobileSidebar,
  dmModalId = "dmModal",
}) {
  const openInbox = useDmStore((state) => state.openInbox);
  const unreadTotal = useDmStore((state) =>
    Object.values(state.conversations).reduce(
      (sum, convo) => sum + (convo.unreadCount || 0),
      0,
    ),
  );
  return (
    <header className="chat-header">
      <div className="chat-header-inner">

        <div className="chat-header-start">

          {/* Мобильный триггер: сайдбар всегда свёрнут по умолчанию, открывается drawer'ом */}
          <button
            type="button"
            className="chat-header-btn sidebar-trigger d-lg-none"
            title="Открыть меню"
            onClick={onOpenMobileSidebar}
          >
            <PanelLeft size={18} />
          </button>

          {/* Десктопный триггер: показывается только если сайдбар свёрнут.
              Наведение — превью, клик — закрепить обратно. */}
          {sidebarCollapsed && (
            <button
              type="button"
              className="chat-header-btn sidebar-trigger d-none d-lg-flex"
              title="Показать боковую панель"
              onMouseEnter={onHoverSidebarIcon}
              onClick={onOpenSidebar}
            >
              <PanelLeft size={18} />
            </button>
          )}

          {/* Название текущей комнаты (с фолбэком на имя приложения,
              пока комната ещё не резолвилась). Логотип убран. */}
          <div className="chat-brand">
            <div className="chat-brand-info">
              <h5 className="chat-brand-title">
                {title || APP_NAME}
              </h5>

              <span
                className={`chat-brand-status ${online ? "is-online" : "is-offline"}`}
              >
                {online ? "Online" : "Connecting…"}
              </span>
            </div>
          </div>
        </div>


        {/* Actions */}
        <div className="chat-header-actions">

          <button
            type="button"
            className="chat-header-btn dm-header-btn"
            title="Особисті повідомлення"
            data-bs-toggle="modal"
            data-bs-target={`#${dmModalId}`}
            onClick={openInbox}
          >
            <Mail size={18} />
            {unreadTotal > 0 && (
              <span className="dm-header-badge">
                {unreadTotal > 99 ? "99+" : unreadTotal}
              </span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
}