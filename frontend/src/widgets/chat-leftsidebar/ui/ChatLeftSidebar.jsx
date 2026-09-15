import { useMemo, useState } from "react";
import { User, MessageSquare, Users, Contact, Settings } from "lucide-react";

import { DmTriggerButton } from "@features/dm";
import { FriendsList } from "@features/friends";
import { BlockedUsersList } from "@features/block";
import { ROOMS } from "@features/chat/constants/rooms.constants.js";
import { useFriendStore } from "@features/friends/model/useFriendStore.js";
import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";

const GENDER_GROUPS = [
  { id: "male", label: "Чоловіки" },
  { id: "female", label: "Жінки" },
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

// id тут навмисно збігаються з MENU_TABS у @widgets/side-menu —
// саме через ці id Bootstrap-таби (pill+pane) знаходять одне одного
// в DOM (href="#pills-<id>" ⇄ id="pills-<id>"), React-зв'язку між
// двома сайдбарами немає.
const PANELS = [
  { id: "user", title: "Профіль", icon: User },
  { id: "chat", title: "Чати", icon: MessageSquare, active: true },
  { id: "users", title: "Користувачі", icon: Users },
  { id: "contacts", title: "Контакти", icon: Contact },
  { id: "setting", title: "Налаштування", icon: Settings },
];

/**
 * Панель-вміст для вкладок іконкової "рейки" — другий з двох лівих
 * сайдбарів, винесений з ChatLayout.jsx (раніше — статичні
 * англомовні заглушки на кшталт "chats tab-pane").
 *
 * - "Чат" — список кімнат.
 * - "Користувачі" — підвкладки "Онлайн" (список + фільтр за статтю),
 *   "Друзі", "Заблоковані".
 * - "Профіль"/"Контакти"/"Налаштування" — заглушки, для них у
 *   застосунку ще немає окремої фічі.
 */
export function ChatLeftSidebar({
  login,
  activeRoom,
  roomCounts,
  roomUsers,
  onSelectRoom,
  onNicknameClick,
  selectedNicknames = [],
}) {
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
        {PANELS.map(({ id, title, icon: Icon, active }) => (
          <div
            key={id}
            className={`tab-pane${active ? " fade show active" : ""}`}
            id={`pills-${id}`}
            role="tabpanel"
            aria-labelledby={`pills-${id}-tab`}
          >
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
                        <div className="app-sidebar-empty">Немає користувачів онлайн</div>
                      ) : (
                        usersByGender[activeGenderGroup].map((user) => {
                          const isOwn = user.login === login;
                          const isSelected = selectedNicknames.includes(user.login);
                          const isFriendUser = friendLogins.has(user.login);

                          return (
                            <div key={user.id} className="app-sidebar-online-item">
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
                                    style={{ "--user-color": getEffectiveColorHex(user.color, isDarkTheme) }}
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

                {activeUserSubTab === "friends" && <FriendsList />}
                {activeUserSubTab === "blocked" && <BlockedUsersList />}
              </div>
            )}

            {id !== "chat" && id !== "users" && (
              <div className="d-flex flex-column align-items-center justify-content-center text-center text-muted p-4">
                <Icon size={28} className="mb-2" />
                <span className="small">Розділ «{title}» ще не реалізовано</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
