import { LogOut, Menu, BookOpen, MessageCircle } from "lucide-react";
import LogoLight from "@shared/assets/logo/logo-light.svg";
import LogoDark from "@shared/assets/logo/logo-dark.svg";
import { RulesModal, FeedbackModal } from "@features/info";
import { LogoutConfirmModal } from "@features/auth/logout/ui/LogoutConfirmModal.jsx";
import { useDmStore } from "@features/dm";
import {
  SIDE_TABS,
  SIDE_TAB_BADGES,
} from "@shared/constants/sideTabs.constants.js";

const RULES_MODAL_ID = "sideMenuRulesModal";
const FEEDBACK_MODAL_ID = "sideMenuFeedbackModal";
const LOGOUT_MODAL_ID = "logoutConfirmModal";

export function SideMenu({ login, onLogout }) {
  const dmUnread = useDmStore((state) =>
    Object.values(state.conversations).reduce(
      (sum, convo) => sum + (convo.unreadCount || 0),
      0,
    ),
  );

  const logos = [
    ["dark", LogoDark],
    ["light", LogoLight],
  ];

  return (
    <div className="side-menu flex-lg-column me-lg-1 ms-lg-0">
      <div className="navbar-brand-box">
        {logos.map(([theme, logo]) => (
          <a key={theme} href="/" className={`logo logo-${theme}`}>
            <span className="logo-sm">
              <img src={logo} alt="Logo" height={30} />
            </span>
          </a>
        ))}
      </div>

      <div className="flex-lg-column my-auto">
        <ul
          className="nav nav-pills side-menu-nav justify-content-center"
          role="tablist"
        >
          {SIDE_TABS.map(({ id, title, icon: Icon, defaultActive, badge }) => (
            <li className="nav-item" key={id} title={title}>
              <a
                className={`nav-link ${defaultActive ? "active" : ""}`}
                id={`pills-${id}-tab`}
                data-bs-toggle="pill"
                href={`#pills-${id}`}
                role="tab"
                aria-label={title}
              >
                <Icon  />
                {badge === SIDE_TAB_BADGES.DM_UNREAD && dmUnread > 0 && (
                  <span className="side-menu-badge">
                    {dmUnread > 99 ? "99+" : dmUnread}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-lg-column d-none d-lg-block">
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
              <Menu  />
            </a>
            <div className="dropdown-menu">
              <button
                type="button"
                className="dropdown-item"
                data-bs-toggle="modal"
                data-bs-target={`#${RULES_MODAL_ID}`}
              >
                Правила <BookOpen size={18} className=" text-muted" />
              </button>
              <button
                type="button"
                className="dropdown-item"
                data-bs-toggle="modal"
                data-bs-target={`#${FEEDBACK_MODAL_ID}`}
              >
                Зворотний зв&apos;язок
                <MessageCircle size={18} className=" text-muted" />
              </button>
              <div className="dropdown-divider"></div>
              <button
                type="button"
                className="dropdown-item"
                data-bs-toggle="modal"
                data-bs-target={`#${LOGOUT_MODAL_ID}`}
              >
                Вийти <LogOut size={18} className=" text-muted" />
              </button>
            </div>
          </li>
        </ul>
      </div>

      <RulesModal modalId={RULES_MODAL_ID} />
      <FeedbackModal modalId={FEEDBACK_MODAL_ID} />
      <LogoutConfirmModal modalId={LOGOUT_MODAL_ID} onConfirm={onLogout} />
    </div>
  );
}
