import {
  User,
  MessageSquare,
  Users,
  Contact,
  Settings,
  LogOut,
  CircleUser,
} from "lucide-react";

import { APP_NAME } from "@shared/constants/auth.constants.js";
import logo from "@shared/assets/logo/logo.svg";

// Пункти вузької іконочної колонки зліва. Це поки що вітрина —
// самі пункти нікуди не ведуть (немає ні маршрутів, ні панелей, на
// які вони мали б перемикати), функціонал навмисно не додається,
// це підготовка місця під майбутні розділи (профіль, групи,
// контакти, налаштування) поруч із чатом.
const MENU_ITEMS = [
  { id: "profile", label: "Профіль", icon: User },
  { id: "chat", label: "Чати", icon: MessageSquare, active: true },
  { id: "groups", label: "Групи", icon: Users },
  { id: "contacts", label: "Контакти", icon: Contact },
  { id: "settings", label: "Налаштування", icon: Settings },
];

// Випадає з нижньої (десктоп) або вбудованої (мобільний) кнопки
// профілю. Один компонент замість двох копій розмітки — раніше
// однаковий dropdown-menu дублювався окремо для мобільного і
// десктопного вигляду.
//
// tooltipEdge: у мобільному рядку (горизонтальна панель) ця кнопка
// завжди крайня справа — тултип прив'язується до правого краю
// кнопки, а не до центру, інакше вилазить за межу екрана (див.
// tooltipEdge на пунктах MENU_ITEMS нижче — той самий принцип).
function ProfileMenu({ itemClassName = "", tooltipEdge = "" }) {
  return (
    <li className={`nav-item btn-group dropup profile-user-dropdown ${itemClassName}`}>
      <a
        className="nav-link dropdown-toggle"
        href="#"
        role="button"
        data-bs-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
        aria-label="Профіль"
        onClick={(event) => event.preventDefault()}
      >
        <CircleUser className="profile-user rounded-circle" size={30} />
        <span className={`side-menu-tooltip ${tooltipEdge}`}>Профіль</span>
      </a>

      <div className="dropdown-menu">
        <a className="dropdown-item" href="#" onClick={(event) => event.preventDefault()}>
          Профіль <User size={14} className="float-end text-muted" />
        </a>
        <a className="dropdown-item" href="#" onClick={(event) => event.preventDefault()}>
          Налаштування <Settings size={14} className="float-end text-muted" />
        </a>
        <div className="dropdown-divider" />
        <a className="dropdown-item" href="#" onClick={(event) => event.preventDefault()}>
          Вийти <LogOut size={14} className="float-end text-muted" />
        </a>
      </div>
    </li>
  );
}

/**
 * Вузька іконочна колонка зліва (не плутати з <Sidebar> — списком
 * кімнат/користувачів). На десктопі — фіксована колонка 75px
 * заввишки на весь екран, на мобільному (< 992px) — нижня панель
 * заввишки 60px (див. layout/_side-menu.css).
 *
 * Це вітрина: пункти меню статичні, без переходів і обробників —
 * компонент лише винесено з ChatLayout, приведено до React-розмітки
 * (className замість class, key на елементах списку) і замінено
 * іконки на lucide-react. Підказки — власний елемент (.side-menu-tooltip),
 * а не нативний title: в тісній колонці/рядку нативні тултипи браузера
 * з'являються із затримкою і перекривають сусідні іконки (той самий
 * принцип, що й у .app-sidebar-tab-tooltip, див. widgets/sidebar).
 * Підключення реальних розділів — окрема задача.
 */
export function SideMenu() {
  return (
    <div className="side-menu flex-lg-column me-lg-0 ms-lg-0">
      <div className="navbar-brand-box">
        <a className="logo" href="#" onClick={(event) => event.preventDefault()}>
          <span className="logo-sm">
            <img src={logo} alt={APP_NAME} height={30} />
          </span>
        </a>
      </div>

      <div className="flex-lg-column my-auto">
        <ul className="nav nav-pills side-menu-nav justify-content-center" role="tablist">
          {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon;
            // Тултип першого пункту прив'язується до лівого краю кнопки
            // замість центру — інакше в мобільному рядку (горизонтальна
            // панель, вузькі краї екрана) він вилазить за межу viewport'а.
            // Останній "звичайний" пункт лишається по центру: крайній
            // праворуч у мобільному рядку — ProfileMenu, саме вона тримає
            // is-align-end (див. нижче).
            const tooltipEdge = index === 0 ? "is-align-start" : "";

            return (
              <li key={item.id} className="nav-item">
                <a
                  className={`nav-link ${item.active ? "active" : ""}`}
                  href="#"
                  role="tab"
                  aria-label={item.label}
                  onClick={(event) => event.preventDefault()}
                >
                  <Icon size={20} />
                  <span className={`side-menu-tooltip ${tooltipEdge}`}>{item.label}</span>
                </a>
              </li>
            );
          })}

          <ProfileMenu itemClassName="d-inline-block d-lg-none" tooltipEdge="is-align-end" />
        </ul>
      </div>

      <div className="flex-lg-column d-none d-lg-block">
        <ul className="nav side-menu-nav justify-content-center">
          <ProfileMenu />
        </ul>
      </div>
    </div>
  );
}
