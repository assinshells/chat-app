import { useMemo, useRef, useState } from "react";
import { LogOut, PanelLeft, Settings, X } from "lucide-react";
import { SettingsModal } from "@features/settings";
import { LogoutConfirmModal } from "@features/auth/logout/ui/LogoutConfirmModal.jsx";
import { DmTriggerButton } from "@features/dm";

import { APP_NAME } from "@shared/constants/auth.constants.js";
import { getColorHex } from "@shared/constants/color.constants.js";
import { ROOMS } from "@features/chat/constants/rooms.constants.js";
import { useAutoHideScrollbar } from "@shared/lib/useAutoHideScrollbar.js";

const USER_GROUPS = [
  { id: "male", label: "Чоловіки" },
  { id: "female", label: "Жінки" },
];

const MAIN_TABS = [
  { id: "rooms", label: "Кімнати" },
  { id: "users", label: "Користувачі" },
];

const SETTINGS_MODAL_ID = "settingsModal";
const LOGOUT_MODAL_ID = "logoutConfirmModal";

/**
 * Бічна панель у дусі Claude / ChatGPT.
 *
 * Десктоп:
 *  - за замовчуванням закріплена (pinned) і видима, штовхає контент праворуч;
 *  - кнопка згортання приховує панель (pinned = false);
 *  - коли панель згорнута, у шапці з'являється іконка — при наведенні
 *    на неї панель тимчасово показується поверх контенту (previewOpen),
 *    а при кліку — закріплюється назад (pinned = true).
 *
 * Мобільні пристрої:
 *  - панель за замовчуванням згорнута;
 *  - відкривається висувним зліва поверх контенту drawer'ом (mobileOpen)
 *    за натисканням на іконку в шапці, закривається за натисканням на
 *    підкладку або на хрестик всередині самої панелі.
 *
 * Кімнати і онлайн-користувачі — живі дані з бекенда (Socket.IO),
 * див. features/chat/model/useChatSocket.js: activeRoom/roomCounts/roomUsers
 * приходять через ChatLayout, тут лише рендер і перемикання.
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
  onNicknameClick,
  selectedNicknames = [],
}) {
  // Верхній рівень табів: список кімнат / список користувачів.
  const [activeTab, setActiveTab] = useState("rooms");
  // Всередині «Користувачі» — ще один рівень табів-фільтрів за статтю.
  const [activeUserGroup, setActiveUserGroup] = useState("male");

  const tabsBodyRef = useRef(null);
  useAutoHideScrollbar(tabsBodyRef);

  // Групуємо учасників активної кімнати за статтю один раз за рендер,
  // а не на кожен чих — список учасників кімнати може бути довгим.
  // gender гарантовано 'male' | 'female' (див. GENDER_VALUES на бекенді,
  // значення 'unknown' прибрано), третя група більше не потрібна.
  const usersByGroup = useMemo(() => {
    const grouped = { male: [], female: [] };

    for (const user of roomUsers) {
      if (grouped[user.gender]) grouped[user.gender].push(user);
    }

    return grouped;
  }, [roomUsers]);

  // На десктопі стан сайдбара строго один із трьох і визначає CSS-клас:
  //  - is-pinned  — закріплений, у потоці (штовхає контент), без анімації
  //                 через проміжний стан — перемикається миттєво по кліку;
  //  - is-preview — тимчасовий показ при наведенні, завжди position: fixed
  //                 (поза потоком), тому НІКОЛИ не штовхає і не смикає
  //                 контент чату, навіть під час transition ширини;
  //  - (немає класу) — згорнутий, теж position: fixed, просто width: 0.
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

        {/* Верх панелі: назва сайту (десктоп і мобільний, без логотипа) /
            кнопка закриття drawer'а (лише мобільний). */}
        <div className="app-sidebar-top">
          <span className="app-sidebar-site-name">
            {APP_NAME}
          </span>

          <button
            type="button"
            className="app-sidebar-btn d-lg-none"
            title="Закрити меню"
            onClick={onCloseMobile}
          >
            <X size={18} />
          </button>
        </div>

        {/* Таби: «Кімнати» / «Користувачі». Займають усе місце від верху
            панелі (або від мобільного хедера) до футера. */}
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
                    usersByGroup[activeUserGroup].map((user) => {
                      const isOwn = user.login === login;
                      const isSelected = selectedNicknames.includes(user.login);

                      return (
                        <div key={user.id} className="app-sidebar-online-item">
                          {/* Свій нік — просто підсвічений червоним, не клікабельний,
                              колір з налаштувань на нього не впливає (залишається як є).
                              Чужий — клікабельний, додає адресата у форму
                              відправлення повідомлення (див. ChatComposer), і фарбується
                              в колір, який цей користувач обрав у
                              налаштуваннях (за замовчуванням — чорний). */}
                          {isOwn ? (
                            <span className="app-sidebar-online-name nickname-own">
                              {user.login}
                            </span>
                          ) : (
                            <>
                              <DmTriggerButton login={user.login} color={user.color} />
                              <button
                                type="button"
                                className={`app-sidebar-online-name app-sidebar-online-name-btn ${
                                  isSelected ? "is-selected" : ""
                                }`}
                                title="Додати користувача у форму повідомлення"
                                style={
                                  user.color && user.color !== "black"
                                    ? { "--user-color": getColorHex(user.color) }
                                    : undefined
                                }
                                onClick={() => onNicknameClick?.(user.login)}
                              >
                                {user.login}
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Профіль користувача внизу панелі: нік (з дропдауном логауту)
            і кнопка згортання — дві незалежні кнопки зі своїм
            ховером у кожної, однієї висоти. */}
        <div className="app-sidebar-footer">
          <div className="dropdown dropup app-sidebar-user-dropdown">
            <button
              type="button"
              className="app-sidebar-user"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <span className="app-sidebar-user-name">{login || "Гість"}</span>
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

  <a  className="dropdown-item"
    href="#"
    data-bs-toggle="modal"
    data-bs-target={`#${LOGOUT_MODAL_ID}`}
    onClick={(e) => e.preventDefault()}
  >
    <LogOut size={16} strokeWidth={2} />
    <span>Вийти</span>
  </a>
</div>
<SettingsModal modalId={SETTINGS_MODAL_ID} />
<LogoutConfirmModal modalId={LOGOUT_MODAL_ID} onConfirm={onLogout} />
          </div>

          {/* На десктопі — поруч з ніком. У прев'ю CSS переносить її
              у лівий верхній кут, врівень з кнопкою в шапці. */}
          <button
            type="button"
            className="app-sidebar-btn app-sidebar-collapse-btn d-none d-lg-flex"
            title={pinned ? "Згорнути бічну панель" : "Закріпити бічну панель"}
            onClick={pinned ? onCollapse : onPin}
          >
            <PanelLeft size={16} />
          </button>
        </div>
      </div>
    </aside>
    
  );
}