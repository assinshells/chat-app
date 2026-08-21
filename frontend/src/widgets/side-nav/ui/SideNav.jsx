import { Users, Repeat, MessagesSquare, Menu, User, Settings } from "lucide-react";
import { LogoutButton } from "@features/auth/logout/ui/LogoutButton.jsx";
import logo from "@shared/assets/logo/logo.svg";

const DEFAULT_TABS = [
  { id: "pills-users", label: "Users", icon: Users, active: true },
  { id: "pills-rooms", label: "Rooms", icon: Repeat },
  { id: "pills-private-chat", label: "Private Chats", icon: MessagesSquare },
];

// Комнаты больше не отдельная bootstrap-вкладка в ChatSidebar — их список
// переехал в user-profile-sidebar (см. pages/ChatPage.jsx), поэтому клик по
// этой пилюле не переключает tab-pane, а открывает панель профиля.
const ROOMS_TAB_ID = "pills-rooms";

/**
 * ProfileMenu — содержимое выпадающего меню профиля (Profile / Setting /
 * Log out). Рендерится дважды — для мобильной пилюли (внутри верхнего
 * nav-pills) и для десктопного dropup внизу side-menu — поэтому вынесено
 * в отдельный (приватный, неэкспортируемый) компонент, а не продублировано
 * инлайном в разметке.
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
 * SideNav — крайняя левая узкая колонка чата: лого, иконочные вкладки-пилюли
 * (Users/Rooms/PrivateChat) и выпадающее меню профиля (мобильный вариант —
 * встроен в пилюли, десктопный — dropup внизу колонки).
 *
 * tabs — конфиг иконок-вкладок; активную вкладку переключает сам Bootstrap
 * (data-bs-toggle="pill"), состояние наружу не поднимается.
 */
export function SideNav({ onLogout, onRoomsClick, tabs = DEFAULT_TABS }) {
  return (
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
          {tabs.map(({ id, label, icon: Icon, active }) => {
            const isRoomsTab = id === ROOMS_TAB_ID;
            return (
              <li className="nav-item" title={label} key={id}>
                <a
                  className={`nav-link${active ? " active" : ""}`}
                  id={`${id}-tab`}
                  data-bs-toggle={isRoomsTab ? undefined : "pill"}
                  href={isRoomsTab ? "#" : `#${id}`}
                  role="tab"
                  onClick={
                    isRoomsTab
                      ? (event) => {
                          event.preventDefault();
                          onRoomsClick?.();
                        }
                      : undefined
                  }
                >
                  <Icon />
                </a>
              </li>
            );
          })}
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
  );
}