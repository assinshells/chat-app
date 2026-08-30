import { Ellipsis, Mail, PanelLeft } from "lucide-react";

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
            className="chat-header-btn"
            title="Особисті повідомлення"
            data-bs-toggle="modal"
            data-bs-target={`#${dmModalId}`}
            onClick={openInbox}
          >
            <Mail size={18} />
          </button>

          <button
            type="button"
            className="chat-header-btn d-none d-lg-flex"
            title="Audio call"
            data-bs-toggle="modal"
            data-bs-target="#audiocallModal"
          >
            <i className="ri-phone-line"></i>
          </button>

          <button
            type="button"
            className="chat-header-btn d-none d-lg-flex"
            title="Video call"
            data-bs-toggle="modal"
            data-bs-target="#videocallModal"
          >
            <i className="ri-vidicon-line"></i>
          </button>

          <button
            type="button"
            className="chat-header-btn d-none d-lg-flex"
            title="Profile"
          >
            <i className="ri-user-2-line"></i>
          </button>


          {/* More */}
          <div className="dropdown">

            <button
              type="button"
              className="chat-header-btn"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <Ellipsis size={18} />
            </button>

            <div className="dropdown-menu dropdown-menu-end chat-dropdown">

              
              <a  className="dropdown-item d-lg-none"
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                <span>View profile</span>
                <i className="ri-user-2-line"></i>
              </a>

              
              <a  className="dropdown-item d-lg-none"
                href="#"
                data-bs-toggle="modal"
                data-bs-target="#audiocallModal"
              >
                <span>Audio call</span>
                <i className="ri-phone-line"></i>
              </a>

              
              <a  className="dropdown-item d-lg-none"
                href="#"
                data-bs-toggle="modal"
                data-bs-target="#videocallModal"
              >
                <span>Video call</span>
                <i className="ri-vidicon-line"></i>
              </a>

              <div className="dropdown-divider d-lg-none"></div>

              
              <a  className="dropdown-item"
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                <span>Archive</span>
                <i className="ri-archive-line"></i>
              </a>

              
              <a  className="dropdown-item"
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                <span>Mute</span>
                <i className="ri-volume-mute-line"></i>
              </a>

              
              <a  className="dropdown-item"
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                <span>Delete</span>
                <i className="ri-delete-bin-line"></i>
              </a>

            </div>
          </div>

        </div>
      </div>
    </header>
  );
}