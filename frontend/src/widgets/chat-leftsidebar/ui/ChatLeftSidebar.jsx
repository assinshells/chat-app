import { useMemo, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { DmTriggerButton, useDmStore } from "@features/dm";
import { FriendsList } from "@features/friends";
import { BlockedUsersList } from "@features/block";
import { ROOMS } from "@features/chat/constants/rooms.constants.js";
import { useFriendStore } from "@features/friends/model/useFriendStore.js";
import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { SIDE_TABS } from "@shared/constants/sideTabs.constants.js";
import {
  applyTheme,
  getStoredTheme,
  THEMES,
  useIsDarkTheme,
} from "@shared/lib/theme.js";

const GENDER_GROUPS = [
  { id: "male", label: "Чоловіки" },
  { id: "female", label: "Жінки" },
];

// Варіанти теми у табі "Налаштування". Раніше жили в окремій модалці
// налаштувань (відкривалася з шапки) — тепер це єдина точка вибору
// теми, а сама модалка видалена: її друга вкладка ("Акаунт") лише
// дублювала панель профілю справа (нік/роль, див. ChatLayout).
const THEME_OPTIONS = [
  { id: THEMES.LIGHT, label: "Світла", icon: Sun },
  { id: THEMES.DARK, label: "Темна", icon: Moon },
  { id: THEMES.SYSTEM, label: "Системна", icon: Monitor },
];

// Підвкладки табу "Користувачі": "Онлайн" — список онлайн-учасників
// активної кімнати з фільтром за статтю (раніше був окремим
// верхньорівневим табом поруч), "Друзі"/"Заблоковані" — перенесені
// сюди з видаленого третього (порожнього) сайдбара. Самі
// FriendsList/BlockedUsersList не змінювались, лише місце показу.
const USER_SUBTABS = [
  { id: "online", label: "Онлайн" },
  { id: "friends", label: "Друзі" },
  { id: "blocked", label: "Заблоковані" },
];

/**
 * Панель-вміст для вкладок іконкової "рейки" — другий з двох лівих
 * сайдбарів, винесений з ChatLayout.jsx (раніше — статичні
 * англомовні заглушки на кшталт "chats tab-pane").
 *
 * Кожна панель починається однаковим заголовком з title відповідного
 * табу в SIDE_TABS (єдине джерело — той самий рядок, що й підпис
 * пілюлі в рейці, тож нема чого дублювати чи розсинхронізовувати).
 *
 * - "Чат" — список кімнат.
 * - "Приватні повідомлення" — список діалогів з useDmStore. Клік по
 *   діалогу перемикає ОСНОВНУ область чату на приватне листування
 *   (onSelectDialog -> ChatLayout -> PrivateChat); activeDialog —
 *   логін діалогу, розгорнутого там зараз, для підсвітки рядка.
 * - "Користувачі" — підвкладки "Онлайн" (список + фільтр за статтю),
 *   "Друзі", "Заблоковані".
 * - "Налаштування" — вибір теми (світла/темна/системна).
 * - "Профіль" — нік поточного користувача; раніше показувався
 *   текстом у дропдауні профілю рейки (@widgets/side-menu), тепер
 *   винесений у власну панель (пілюля цього табу лишається в рейці
 *   на своєму звичайному місці).
 *
 * Таба "Контакти" в застосунку більше немає (прибрано повністю разом
 * з пілюлею в рейці — окремої фічі під нього так і не було).
 */
export function ChatLeftSidebar({
  login,
  activeRoom,
  roomCounts,
  roomUsers,
  onSelectRoom,
  onNicknameClick,
  onSelectDialog,
  activeDialog = null,
  selectedNicknames = [],
}) {
  // Обраний варіант теми (light/dark/system). Джерело правди —
  // localStorage (див. shared/lib/theme.js), тут лише локальне
  // відображення поточного вибору для підсвітки активної кнопки.
  const [theme, setTheme] = useState(() => getStoredTheme());

  const handleThemeSelect = (next) => {
    setTheme(next);
    applyTheme(next);
  };

  // Підвкладка всередині "Користувачі": Онлайн / Друзі / Заблоковані.
  const [activeUserSubTab, setActiveUserSubTab] = useState("online");
  // Ще один рівень підвкладок всередині "Онлайн": фільтр за статтю.
  const [activeGenderGroup, setActiveGenderGroup] = useState("male");

  // Тема — щоб --user-color (нік учасника в списку "Онлайн")
  // рендерився правильним відтінком під поточну тему (див.
  // getEffectiveColorHex у ChatConversation.jsx — та сама логіка тут).
  const isDarkTheme = useIsDarkTheme();

  // Друзі виділяються жирним у списку "Онлайн" (див.
  // .app-sidebar-online-name-btn.is-friend у _sidebar.css) — підписка
  // саме на friendLogins (Set), а не на isFriend-функцію, щоб список
  // коректно перерендерився при зміні (нова/старий Set — різні
  // референси, сама функція стабільна і ререндер не викликала б).
  const friendLogins = useFriendStore((state) => state.friendLogins);

  // Діалоги для табу "Приватні повідомлення". Джерело — той самий
  // useDmStore, що й у модалці особистих повідомлень: список
  // наповнюється syncList одразу після конекту (див. ChatLayout) і
  // живими подіями dm:new, тому окремих запитів тут не потрібно.
  const dmConversations = useDmStore((state) => state.conversations);
  const dmOrder = useDmStore((state) => state.order);
  const dmListLoading = useDmStore((state) => state.listLoading);

  // Група учасників активної кімнати за статтю рахується один раз за
  // рендер, а не на кожен чих — список учасників кімнати може бути
  // довгим. gender може бути лише 'male' | 'female' (див. GENDER_VALUES
  // на бекенді).
  const usersByGender = useMemo(() => {
    const grouped = { male: [], female: [] };

    for (const user of roomUsers) {
      if (grouped[user.gender]) grouped[user.gender].push(user);
    }

    return grouped;
  }, [roomUsers]);

  return (
    <div className="chat-leftsidebar me-lg-1 ms-lg-0">
      <div className="tab-content">
        {SIDE_TABS.map(({ id, title, icon: Icon, defaultActive }) => (
          <div
            key={id}
            className={`tab-pane${defaultActive ? " fade show active" : ""}`}
            id={`pills-${id}`}
            role="tabpanel"
            aria-labelledby={`pills-${id}-tab`}
          >
            <div className="px-4 pt-4">
              <h4 className="mb-0">{title}</h4>
            </div>

            {id === "chat" && (
              <div className="app-sidebar-list">
                {ROOMS.map((room) => (
                  <a
                    key={room.id}
                    href="#"
                    className={`app-sidebar-room-item ${
                      room.id === activeRoom ? "is-active" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectRoom?.(room.id);
                    }}
                  >
                    <span className="app-sidebar-room-name">{room.name}</span>
                    <span className="app-sidebar-room-count">
                      {roomCounts?.[room.id] ?? 0}
                    </span>
                  </a>
                ))}
              </div>
            )}

            {id === "private" && (
              <div className="app-sidebar-list app-sidebar-dialogs">
                {dmOrder.length === 0 ? (
                  <div className="app-sidebar-empty">
                    {dmListLoading
                      ? "Завантаження…"
                      : "Немає розпочатих діалогів"}
                  </div>
                ) : (
                  dmOrder.map((dialogLogin) => {
                    const convo = dmConversations[dialogLogin];
                    if (!convo) return null;

                    const preview =
                      convo.lastMessage?.text ??
                      convo.messages[convo.messages.length - 1]?.text;

                    return (
                      <button
                        key={dialogLogin}
                        type="button"
                        className={`app-sidebar-dialog-item ${
                          dialogLogin === activeDialog ? "is-active" : ""
                        }`}
                        onClick={() =>
                          onSelectDialog?.(dialogLogin, convo.color)
                        }
                      >
                        <span className="app-sidebar-dialog-row">
                          <span
                            className="app-sidebar-dialog-name"
                            style={{
                              color: getEffectiveColorHex(
                                convo.color,
                                isDarkTheme,
                              ),
                            }}
                          >
                            {dialogLogin}
                          </span>
                          {convo.unreadCount > 0 && (
                            <span className="app-sidebar-dialog-badge">
                              {convo.unreadCount > 99
                                ? "99+"
                                : convo.unreadCount}
                            </span>
                          )}
                        </span>
                        <span className="app-sidebar-dialog-preview">
                          {preview ?? "Немає повідомлень"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {id === "users" && (
              <div className="app-sidebar-users">
                <div className="app-sidebar-subtabs-nav">
                  {USER_SUBTABS.map((subtab) => (
                    <button
                      key={subtab.id}
                      type="button"
                      className={`app-sidebar-subtab-btn ${activeUserSubTab === subtab.id ? "is-active" : ""}`}
                      onClick={() => setActiveUserSubTab(subtab.id)}
                    >
                      {subtab.label}
                    </button>
                  ))}
                </div>

                {activeUserSubTab === "online" && (
                  <div className="app-sidebar-users">
                    <div className="app-sidebar-subtabs-nav">
                      {GENDER_GROUPS.map((group) => (
                        <button
                          key={group.id}
                          type="button"
                          className={`app-sidebar-subtab-btn ${activeGenderGroup === group.id ? "is-active" : ""}`}
                          onClick={() => setActiveGenderGroup(group.id)}
                        >
                          {group.label} · {usersByGender[group.id].length}
                        </button>
                      ))}
                    </div>

                    <div className="app-sidebar-list">
                      {usersByGender[activeGenderGroup].length === 0 ? (
                        <div className="app-sidebar-empty">
                          Немає користувачів онлайн
                        </div>
                      ) : (
                        usersByGender[activeGenderGroup].map((user) => {
                          const isOwn = user.login === login;
                          const isSelected = selectedNicknames.includes(
                            user.login,
                          );
                          const isFriendUser = friendLogins.has(user.login);

                          return (
                            <div
                              key={user.id}
                              className="app-sidebar-online-item"
                            >
                              {/* Свій нік — просто підсвічений червоним, не клікабельний,
                                  колір з налаштувань на нього не впливає (залишається як є).
                                  Чужий — клікабельний, додає адресата у форму
                                  відправлення повідомлення (див. ChatComposer), і фарбується
                                  в колір, який цей користувач обрав у
                                  налаштуваннях (за замовчуванням — чорний). Друг (див.
                                  features/friends) додатково виділяється жирним шрифтом. */}
                              {isOwn ? (
                                <span className="app-sidebar-online-name nickname-own">
                                  {user.login}
                                </span>
                              ) : (
                                <>
                                  <DmTriggerButton
                                    login={user.login}
                                    color={user.color}
                                    room={activeRoom}
                                  />
                                  <button
                                    type="button"
                                    className={`app-sidebar-online-name app-sidebar-online-name-btn ${
                                      isSelected ? "is-selected" : ""
                                    } ${isFriendUser ? "is-friend" : ""}`}
                                    title={
                                      isFriendUser
                                        ? "Друг · Додати користувача у форму повідомлення"
                                        : "Додати користувача у форму повідомлення"
                                    }
                                    style={{
                                      "--user-color": getEffectiveColorHex(
                                        user.color,
                                        isDarkTheme,
                                      ),
                                    }}
                                    onClick={() =>
                                      onNicknameClick?.(user.login)
                                    }
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

                {activeUserSubTab === "friends" && <FriendsList />}
                {activeUserSubTab === "blocked" && <BlockedUsersList />}
              </div>
            )}

            {id === "user" && (
              <div className="text-center p-4 border-bottom">
                <h5 className="font-size-16 mb-1 text-truncate">{login}</h5>
              </div>
            )}

            {id === "setting" && (
              <div>
                <div className="text-center p-4 border-bottom">
                  <h5 className="font-size-16 mb-1 text-truncate">{login}</h5>
                  <div className="dropdown d-inline-block mb-1">
                                    <a className="text-muted dropdown-toggle pb-1 d-block" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        Available <i className="mdi mdi-chevron-down"></i>
                                    </a>
          
                                    <div className="dropdown-menu">
                                      <a className="dropdown-item" href="#">Available</a>
                                      <a className="dropdown-item" href="#">Busy</a>
                                    </div>
                                </div>
                </div>
                {THEME_OPTIONS.map(
                  ({ id: themeId, label, icon: ThemeIcon }) => (
                    <button
                      key={themeId}
                      type="button"
                      className={`app-sidebar-theme-btn ${theme === themeId ? "is-active" : ""}`}
                      onClick={() => handleThemeSelect(themeId)}
                    >
                      <ThemeIcon size={18} />
                      <span>{label}</span>
                    </button>
                  ),
                )}
              </div>
            )}

            {id !== "chat" &&
              id !== "users" &&
              id !== "private" &&
              id !== "setting" &&
              id !== "user" && (
                <div className="d-flex flex-column align-items-center justify-content-center text-center text-muted p-4">
                  <Icon size={28} className="mb-2" />
                  <span className="small">
                    Розділ «{title}» ще не реалізовано
                  </span>
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
