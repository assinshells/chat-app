import { Menu, MessageCircle } from "lucide-react";
import brandImage from "@shared/assets/logo/brand-white.png";
import { useDmStore } from "@features/dm";
import {
  PRIVATE_MODAL_ID,
  PRIVATE_MODAL_TRIGGER_ID,
} from "@shared/constants/privateModal.constants.js";
import { LogoutConfirmModal } from "@features/auth/logout/ui/LogoutConfirmModal.jsx";

const LOGOUT_MODAL_ID = "logoutConfirmModal";

// Посилання-заглушки: замінити href/назви на реальні маршрути.
const NAV_LINKS = Object.freeze([
  { id: "home", label: "Головна" },
  { id: "explore", label: "Огляд" },
  { id: "news", label: "Новини" },
  { id: "help", label: "Допомога" },
  { id: "about", label: "Про нас" },
]);

export function Navbar({ onLogout }) {
  // Сумарний лічильник непрочитаних особистих повідомлень (раніше
  // жив бейджем на іконці "Пошта" в бічній рейці).
  const dmUnread = useDmStore((state) =>
    Object.values(state.conversations).reduce(
      (sum, convo) => sum + (convo.unreadCount || 0),
      0,
    ),
  );

  return (
    <>
      <nav className="navbar app-navbar bg-primary fixed-top" aria-label="Головна навігація">
        <div className="container-fluid">
          <a href="/" className="navbar-brand">
            <img src={brandImage} alt="brand" height={30} />
          </a>

          <ul className="nav app-navbar-links me-auto d-none d-md-flex">
            {NAV_LINKS.map(({ id, label }) => (
              <li className="nav-item" key={id}>
                <a
                  href="#"
                  className="nav-link app-navbar-link"
                  onClick={(e) => e.preventDefault()}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <div className="d-flex align-items-center ms-auto ms-md-0">
            {/* Тригер модалки приватних повідомлень (PrivateMessagesModal,
                рендериться в ChatLayout) + лічильник непрочитаних. */}
            <button
              type="button"
              id={PRIVATE_MODAL_TRIGGER_ID}
              className="btn app-navbar-toggle app-navbar-dm position-relative"
              data-bs-toggle="modal"
              data-bs-target={`#${PRIVATE_MODAL_ID}`}
              title="Приватні повідомлення"
              aria-label="Приватні повідомлення"
            >
              <MessageCircle size={24} />
              {dmUnread > 0 && (
                <span className="app-navbar-dm-badge badge bg-danger">
                  {dmUnread > 99 ? "99+" : dmUnread}
                  <span className="visually-hidden">
                    непрочитаних особистих повідомлень
                  </span>
                </span>
              )}
            </button>

          <div className="dropdown">
            <button
              type="button"
              className="btn app-navbar-toggle"
              data-bs-toggle="dropdown"
              data-bs-offset="0,8"
              aria-expanded="false"
              aria-label="Меню"
            >
              <Menu size={24} />
            </button>

            <ul className="dropdown-menu dropdown-menu-end app-navbar-dropdown">
              {/* На вузьких екранах лінки навбара ховаються — дублюємо їх тут. */}
              {NAV_LINKS.map(({ id, label }) => (
                <li className="d-md-none" key={id}>
                  <a
                    className="dropdown-item"
                    href="#"
                    onClick={(e) => e.preventDefault()}
                  >
                    {label}
                  </a>
                </li>
              ))}
              <li className="d-md-none">
                <hr className="dropdown-divider" />
              </li>
              <li>
                <button
                  type="button"
                  className="dropdown-item"
                  data-bs-toggle="modal"
                  data-bs-target={`#${LOGOUT_MODAL_ID}`}
                >
                  Вийти
                </button>
              </li>
            </ul>
          </div>
          </div>
        </div>
      </nav>

      <LogoutConfirmModal modalId={LOGOUT_MODAL_ID} onConfirm={onLogout} />
    </>
  );
}
