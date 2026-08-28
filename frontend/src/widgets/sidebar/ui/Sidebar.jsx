import { useMemo, useRef, useState } from "react";
import { LogOut, PanelLeft, Settings, X } from "lucide-react";
import { SettingsModal } from "@features/settings";

import { APP_NAME } from "@shared/constants/auth.constants.js";
import { ROOMS } from "@features/chat/constants/rooms.constants.js";
import { useAutoHideScrollbar } from "@shared/lib/useAutoHideScrollbar.js";

const USER_GROUPS = [
  { id: "male", label: "Чоловіки" },
  { id: "female", label: "Жінки" },
  { id: "unknown", label: "Невідомі" },
];

const MAIN_TABS = [
  { id: "rooms", label: "Кімнати" },
  { id: "users", label: "Користувачі" },
];

const SETTINGS_MODAL_ID = "settingsModal";

/**
 * Боковая панель в духе Claude / ChatGPT.
 *
 * Десктоп:
 *  - по умолчанию закреплена (pinned) и видна, толкает контент вправо;
 *  - кнопка сворачивания скрывает панель (pinned = false);
 *  - когда панель свёрнута, в шапке появляется иконка — при наведении
 *    на неё панель временно показывается поверх контента (previewOpen),
 *    а при клике — закрепляется обратно (pinned = true).
 *
 * Мобильные устройства:
 *  - панель по умолчанию свёрнута;
 *  - открывается выезжающим слева поверх контента drawer'ом (mobileOpen)
 *    по нажатию на иконку в шапке, закрывается по нажатию на подложку
 *    или на крестик внутри самой панели.
 *
 * Комнаты и онлайн-пользователи — живые данные с бэкенда (Socket.IO),
 * см. features/chat/model/useChatSocket.js: activeRoom/roomCounts/roomUsers
 * приходят через ChatLayout, здесь только рендер и переключение.
 */
export function Sidebar({
  pinned,
  previewOpen,
  mobileOpen,
  onPin,
  onCollapse,
  onHoverEnter,
  onHoverLeave,
  onCloseMobile,
  onLogout,
  login,
  activeRoom,
  roomCounts,
  roomUsers,
  onSelectRoom,
}) {
  // Верхний уровень табов: список комнат / список пользователей.
  const [activeTab, setActiveTab] = useState("rooms");
  // Внутри «Користувачі» — ещё один уровень табов-фильтров по полу.
  const [activeUserGroup, setActiveUserGroup] = useState("male");

  const tabsBodyRef = useRef(null);
  useAutoHideScrollbar(tabsBodyRef);

  // Группируем участников активной комнаты по гендеру один раз за рендер,
  // а не на каждый чих — список участников комнаты может быть длинным.
  const usersByGroup = useMemo(() => {
    const grouped = { male: [], female: [], unknown: [] };

    for (const user of roomUsers) {
      const key = grouped[user.gender] ? user.gender : "unknown";
      grouped[key].push(user);
    }

    return grouped;
  }, [roomUsers]);

  // На десктопе состояние сайдбара строго одно из трёх и определяет CSS-класс:
  //  - is-pinned  — закреплён, в потоке (толкает контент), без анимации через
  //                 промежуточное состояние — переключается мгновенно по клику;
  //  - is-preview — временный показ по наведению, всегда position: fixed
  //                 (вне потока), поэтому НИКОГДА не толкает и не дёргает
  //                 контент чата, даже во время transition ширины;
  //  - (нет класса) — свёрнут, тоже position: fixed, просто width: 0.
  const desktopStateClass = pinned
    ? "is-pinned"
    : previewOpen
      ? "is-preview"
      : "";

  const className = [
    "app-sidebar",
    desktopStateClass,
    mobileOpen ? "is-mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside
      className={className}
      onMouseEnter={() => {
        if (!pinned) onHoverEnter();
      }}
      onMouseLeave={() => {
        if (!pinned) onHoverLeave();
      }}
    >
      <div className="app-sidebar-inner app-scrollbar">

        {/* Верх панели: название сайта (десктоп и мобильный, без логотипа) /
            кнопка закрытия drawer'а (только мобильный). */}
        <div className="app-sidebar-top">
          <span className="app-sidebar-site-name">
            {APP_NAME}
          </span>

          <button
            type="button"
            className="app-sidebar-btn d-lg-none"
            title="Закрыть меню"
            onClick={onCloseMobile}
          >
            <X size={18} />
          </button>
        </div>

        {/* Табы: «Кімнати» / «Користувачі». Занимают всё место от верха
            панели (или от мобильного хедера) до футера. */}
        <div className="app-sidebar-tabs">

          <div className="app-sidebar-tabs-nav">
            {MAIN_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`app-sidebar-tab-btn ${activeTab === tab.id ? "is-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div ref={tabsBodyRef} className="app-sidebar-tabs-body app-scrollbar">

            {activeTab === "rooms" && (
              <div className="app-sidebar-list">
                {ROOMS.map((room) => (
                  
                  <a  key={room.id}
                    href="#"
                    className={`app-sidebar-room-item ${
                      room.id === activeRoom ? "is-active" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectRoom(room.id);
                    }}
                  >
                    <span className="app-sidebar-room-name">{room.name}</span>
                    <span className="app-sidebar-room-count">
                      {roomCounts[room.id] ?? 0}
                    </span>
                  </a>
                ))}
              </div>
            )}

            {activeTab === "users" && (
              <div className="app-sidebar-users">

                <div className="app-sidebar-subtabs-nav">
                  {USER_GROUPS.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      className={`app-sidebar-subtab-btn ${activeUserGroup === group.id ? "is-active" : ""}`}
                      onClick={() => setActiveUserGroup(group.id)}
                    >
                      {group.label} · {usersByGroup[group.id].length}
                    </button>
                  ))}
                </div>

                <div className="app-sidebar-list">
                  {usersByGroup[activeUserGroup].length === 0 ? (
                    <div className="app-sidebar-empty">Немає користувачів онлайн</div>
                  ) : (
                    usersByGroup[activeUserGroup].map((user) => (
                      <div key={user.id} className="app-sidebar-online-item">
                        <span className="app-sidebar-online-dot" />
                        <span>{user.login}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Профиль пользователя внизу панели: ник (с дропдауном логаута)
            и кнопка сворачивания — две независимые кнопки со своим
            ховером у каждой, одной высоты. */}
        <div className="app-sidebar-footer">
          <div className="dropdown dropup app-sidebar-user-dropdown">
            <button
              type="button"
              className="app-sidebar-user"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <span className="app-sidebar-user-name">{login || "Гость"}</span>
            </button>

            <div className="dropdown-menu app-sidebar-user-menu">
  <a className="dropdown-item"
    href="#"
    data-bs-toggle="modal"
    data-bs-target={`#${SETTINGS_MODAL_ID}`}
    onClick={(e) => e.preventDefault()}
  >
    <Settings size={16} strokeWidth={2} />
    <span>Налаштування</span>
  </a>

  <div className="dropdown-divider"></div>

  <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); onLogout(); }}>
    <LogOut size={16} strokeWidth={2} />
    <span>Выйти</span>
  </a>
</div><SettingsModal modalId={SETTINGS_MODAL_ID} />
          </div>

          {/* На десктопе — рядом с ником. В превью CSS переносит её
              в левый верхний угол, вровень с кнопкой в шапке. */}
          <button
            type="button"
            className="app-sidebar-btn app-sidebar-collapse-btn d-none d-lg-flex"
            title={pinned ? "Свернуть боковую панель" : "Закрепить боковую панель"}
            onClick={pinned ? onCollapse : onPin}
          >
            <PanelLeft size={16} />
          </button>
        </div>
      </div>
    </aside>
    
  );
}