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

/**
 * Вузька іконкова "рейка" зліва — перший з двох лівих сайдбарів,
 * винесений з ChatLayout.jsx (раніше лежав там статичною розміткою
 * зі шрифтовими іконками Remix і посиланнями на неіснуючі assets/*).
 *
 * Перелік вкладок — спільний зі списком панелей у
 * @widgets/chat-leftsidebar (див. SIDE_TABS): зв'язок між ними
 * тримається на збігу id, тому список навмисно один на двох.
 *
 * Власного стану перемикання вкладок не тримає: активна вкладка і
 * показ панелей — робота вбудованого Bootstrap JS
 * (bootstrap.bundle.min.js, вже підключений у main.jsx). Єдина
 * підписка на стор — лічильник непрочитаних особистих повідомлень
 * (бейдж на вкладці "Приватні повідомлення"): раніше той самий
 * лічильник рахувався ще й у шапці, поруч з іконкою "Пошта" —
 * тепер точка одна.
 *
 * У дропдауні профілю — вихід з акаунту (з підтвердженням; з шапки
 * прибраний) і посилання на допоміжні
 * модалки "Правила" й "Зворотний зв'язок".
 */
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
              <Menu  />
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
                Правила <BookOpen size={14} className="float-end text-muted" />
              </button>
              <button
                type="button"
                className="dropdown-item"
                data-bs-toggle="modal"
                data-bs-target={`#${FEEDBACK_MODAL_ID}`}
              >
                Зворотний зв&apos;язок
                <MessageCircle size={14} className="float-end text-muted" />
              </button>
              <div className="dropdown-divider"></div>
              {/* Вихід — єдина точка в застосунку (з шапки прибрано):
                  дію тут і там дублювати нема сенсу, а дропдаун профілю
                  для неї природніше місце. Підтвердження — та сама
                  LogoutConfirmModal, що раніше рендерилась у шапці. */}
              <button
                type="button"
                className="dropdown-item"
                data-bs-toggle="modal"
                data-bs-target={`#${LOGOUT_MODAL_ID}`}
              >
                Вийти <LogOut size={14} className="float-end text-muted" />
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
