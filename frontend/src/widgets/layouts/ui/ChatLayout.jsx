import { Users, Repeat, MessagesSquare, Menu, User, Settings } from "lucide-react";
import { LogoutButton } from "@features/auth/logout/ui/LogoutButton.jsx";
import logo from "@shared/assets/logo/logo.svg";

const DEFAULT_TABS = [
  { id: "pills-users", label: "Users", icon: Users },
  { id: "pills-rooms", label: "Rooms", icon: Repeat, active: true },
  { id: "pills-private-chat", label: "Private Chats", icon: MessagesSquare },
];

/**
 * ProfileMenu — содержимое выпадающего меню профиля (Profile / Setting /
 * Log out). Рендерится дважды — для мобильной пилюли (внутри верхнего
 * nav-pills) и для десктопного dropup внизу side-menu — поэтому вынесено
 * в отдельный компонент, а не продублировано инлайном в разметке.
 */
function ProfileMenu({ onLogout, wrapperClassName }) {
  return (
    <li className={wrapperClassName}>
      <a
        className="nav-link dropdown-toggle arrow-none"
        href="#"
        role="button"
        data-bs-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        <Menu />
      </a>
      <div className="dropdown-menu">
        <a className="dropdown-item d-flex align-items-center justify-content-between" href="#">
          Profile
          <User className="text-muted" size={20} strokeWidth={2} />
        </a>
        <a className="dropdown-item d-flex align-items-center justify-content-between" href="#">
          Setting
          <Settings className="text-muted" size={20} strokeWidth={2} />
        </a>
        <div className="dropdown-divider" />
        <LogoutButton onLoggedOut={onLogout} variant="menu-item" />
      </div>
    </li>
  );
}

/**
 * ChatLayout — структурный каркас страницы чата: иконочный side-menu
 * с выпадающим меню профиля, боковая панель со вкладками (tab-content)
 * и основная область чата.
 *
 * tabs           — конфиг иконок-вкладок в side-menu (по умолчанию Users/Rooms/Private).
 * sidebarContent — содержимое tab-content боковой панели (пары <div className="tab-pane" id="{tab.id}">).
 * mainContent    — содержимое области чата справа.
 */
export function ChatLayout({
  onLogout,
  tabs = DEFAULT_TABS,
  sidebarContent,
  mainContent,
}) {
  return (
    <div className="layout-wrapper d-lg-flex">
      {/* Start left sidebar-menu */}
      <div className="side-menu flex-lg-column me-lg-1 ms-lg-0">
        {/* Start Logo */}
        <div className="navbar-brand-box">
          <a href="/" className="logo logo-dark">
            <span className="logo-sm">
              <img src={logo} alt="Logo" height="30" />
            </span>
          </a>
          <a href="/" className="logo logo-light">
            <span className="logo-sm">
              <img src={logo} alt="Logo" height="30" />
            </span>
          </a>
        </div>
        {/* End Logo */}

        {/* Start side-menu nav (mobile: tabs + profile dropdown in one row) */}
        <div className="flex-lg-column my-auto">
          <ul className="nav nav-pills side-menu-nav justify-content-center" role="tablist">
            {tabs.map(({ id, label, icon: Icon, active }) => (
              <li className="nav-item" title={label} key={id}>
                <a
                  className={`nav-link${active ? " active" : ""}`}
                  id={`${id}-tab`}
                  data-bs-toggle="pill"
                  href={`#${id}`}
                  role="tab"
                >
                  <Icon />
                </a>
              </li>
            ))}
            <ProfileMenu
              onLogout={onLogout}
              wrapperClassName="nav-item dropdown profile-user-dropdown d-inline-block d-lg-none"
            />
          </ul>
        </div>
        {/* End side-menu nav */}

        {/* Desktop-only: profile dropdown pinned to the bottom of side-menu */}
        <div className="flex-lg-column d-none d-lg-block">
          <ul className="nav side-menu-nav justify-content-center">
            <ProfileMenu
              onLogout={onLogout}
              wrapperClassName="nav-item btn-group dropup profile-user-dropdown"
            />
          </ul>
        </div>
      </div>
      {/* End left sidebar-menu */}

      {/* Start chat-leftsidebar */}
      <div className="chat-leftsidebar me-lg-1 ms-lg-0">
        <div className="tab-content">{sidebarContent}</div>
      </div>
      {/* End chat-leftsidebar */}

      {/* Start User chat */}
      <div className="user-chat w-100 overflow-hidden">
        <div className="d-lg-flex">{mainContent}</div>
      </div>
      {/* End User chat */}
    </div>
  );
}