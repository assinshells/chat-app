import { User, MessageSquare, Users, Contact, Settings, LogOut, Menu, BookOpen, MessageCircle } from "lucide-react";

import { RulesModal, FeedbackModal } from "@features/info";
import { APP_NAME } from "@shared/constants/auth.constants.js";

const RULES_MODAL_ID = "sideMenuRulesModal";
const FEEDBACK_MODAL_ID = "sideMenuFeedbackModal";

// Вкладки іконкової "рейки". Перемикання — виключно через Bootstrap
// pill-tabs (data-bs-toggle="pill"), без додаткового React-стану:
// відповідні панелі лежать у другому винесеному сайдбарі
// (@widgets/chat-leftsidebar) і зв'язані тими самими id (#pills-<id>) —
// компоненти НЕ знають одне про одного напряму.
const MENU_TABS = [
  { id: "user", title: "Профіль", icon: User },
  { id: "chat", title: "Чати", icon: MessageSquare},
  { id: "users", title: "Користувачі", icon: Users, active: true },
  { id: "contacts", title: "Контакти", icon: Contact },
  { id: "setting", title: "Налаштування", icon: Settings },
];

/**
 * Вузька іконкова "рейка" зліва — перший з двох лівих сайдбарів,
 * винесений з ChatLayout.jsx (раніше лежав там статичною розміткою
 * зі шрифтовими іконками Remix і посиланнями на неіснуючі assets/*).
 *
 * Реального стану не тримає: активна вкладка і перемикання панелей —
 * робота вбудованого Bootstrap JS (bootstrap.bundle.min.js, вже
 * підключений у main.jsx), тому компонент лишається "тупим" і легким.
 *
 * У дропдауні профілю, крім виходу, лежать посилання на допоміжні
 * модалки "Правила" й "Зворотний зв'язок" — перенесені сюди з
 * видаленого третього (порожнього) сайдбара разом із самими
 * модалками (раніше в @widgets/sidebar).
 */
export function SideMenu({ login, onLogout }) {
  return (
    <div className="side-menu flex-lg-column me-lg-1 ms-lg-0">
      <div className="navbar-brand-box d-flex align-items-center justify-content-center">
        <span className="fw-bold">{APP_NAME}</span>
      </div>

      <div className="flex-lg-column my-auto">
        <ul
          className="nav nav-pills side-menu-nav justify-content-center"
          role="tablist"
        >
          {MENU_TABS.map(({ id, title, icon: Icon, active }) => (
            <li className="nav-item" key={id} title={title}>
              <a
                className={`nav-link ${active ? "active" : ""}`}
                id={`pills-${id}-tab`}
                data-bs-toggle="pill"
                href={`#pills-${id}`}
                role="tab"
                aria-label={title}
              >
                <Icon size={18} />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-lg-column">
        <ul className="nav side-menu-nav justify-content-center">
          <li className="nav-item dropdown dropup profile-user-dropdown">
            <a
              className="nav-link"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
              title={login}
            >
              <Menu size={20} />
            </a>
            <div className="dropdown-menu dropdown-menu-end">
              <span className="dropdown-item-text text-truncate d-block">
                {login}
              </span>
              <div className="dropdown-divider"></div>
              <button
                type="button"
                className="dropdown-item"
                data-bs-toggle="modal"
                data-bs-target={`#${RULES_MODAL_ID}`}
              >
                Правила{" "}
                <BookOpen size={14} className="float-end text-muted" />
              </button>
              <button
                type="button"
                className="dropdown-item"
                data-bs-toggle="modal"
                data-bs-target={`#${FEEDBACK_MODAL_ID}`}
              >
                Зворотний зв&apos;язок{" "}
                <MessageCircle size={14} className="float-end text-muted" />
              </button>
              <div className="dropdown-divider"></div>
              <button
                type="button"
                className="dropdown-item"
                onClick={onLogout}
              >
                Вийти <LogOut size={14} className="float-end text-muted" />
              </button>
            </div>
          </li>
        </ul>
      </div>

      <RulesModal modalId={RULES_MODAL_ID} />
      <FeedbackModal modalId={FEEDBACK_MODAL_ID} />
    </div>
  );
}
