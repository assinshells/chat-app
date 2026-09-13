import { useMemo, useState } from "react";
import SimpleBar from "simplebar-react";
import { PanelLeft, X, MessageSquare, Users, Star, Ban } from "lucide-react";
import { DmTriggerButton } from "@features/dm";
import { RulesModal, FeedbackModal, SafetyWarningModal } from "@features/info";
import { BlockedUsersList } from "@features/block";
import { FriendsList } from "@features/friends";
import { useFriendStore } from "@features/friends/model/useFriendStore.js";

import { APP_NAME } from "@shared/constants/auth.constants.js";
import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { ROOMS } from "@features/chat/constants/rooms.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";

const RULES_MODAL_ID = "sidebarRulesModal";
const FEEDBACK_MODAL_ID = "sidebarFeedbackModal";
const SAFETY_WARNING_MODAL_ID = "sidebarSafetyWarningModal";

const USER_GROUPS = [
  { id: "male", label: "Чоловіки" },
  { id: "female", label: "Жінки" },
];

// Іконки замість повного тексту (не влазять 4 підписи в один рядок,
// див. обговорення оптимізації сайдбара) — підпис лишається лише для
// title-тултипа і для тексту біля АКТИВНОГО табу (див.
// .app-sidebar-tab-label в _sidebar.css), решта показує саму іконку.
const MAIN_TABS = [
  { id: "rooms", label: "Кімнати", icon: MessageSquare },
  { id: "users", label: "Користувачі", icon: Users },
  { id: "friends", label: "Друзі", icon: Star },
  { id: "blocked", label: "Заблоковані", icon: Ban },
];

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

  // Тема — щоб --user-color (нік учасника в списку "Користувачі")
  // рендерився правильним відтінком під поточну тему (див.
  // getEffectiveColorHex у ChatConversation.jsx — та сама логіка тут).
  const isDarkTheme = useIsDarkTheme();

  // Друзі виділяються жирним у списку "Користувачі" (див.
  // .app-sidebar-online-name-btn.is-friend у _sidebar.css) — підписка
  // саме на friendLogins (Set), а не на isFriend-функцію, щоб список
  // коректно перерендерився при зміні (нова/старий Set — різні
  // референси, сама функція стабільна і ререндер не викликала б).
  const friendLogins = useFriendStore((state) => state.friendLogins);

  // Групуємо учасників активної кімнати за статтю один раз за рендер,
  // а не на кожен чих — список учасників кімнати може бути довгим.
  // gender може бути лише 'male' | 'female' (див. GENDER_VALUES на
  // бекенді).
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
      <div className="app-sidebar-inner">

        {/* Верх панелі: назва сайту (десктоп і мобільний, без логотипа),
            кнопка згортання/закріплення (лише десктоп — раніше жила в
            футері поруч із ніком, тепер у закріпленому стані живе тут,
            поруч із назвою сайту; у прев'ю CSS, як і раніше, переносить
            її в лівий верхній кут, врівень з кнопкою-тригером у шапці
            чата, див. .app-sidebar.is-preview .app-sidebar-collapse-btn
            у _sidebar.css) і кнопка закриття drawer'а (лише мобільний). */}
        <div className="app-sidebar-top">
          <span className="app-sidebar-site-name">
            {APP_NAME}
          </span>

          <div className="app-sidebar-top-actions">
            <button
              type="button"
              className="app-sidebar-btn app-sidebar-collapse-btn d-none d-lg-flex"
              title={pinned ? "Згорнути бічну панель" : "Закріпити бічну панель"}
              onClick={pinned ? onCollapse : onPin}
            >
              <PanelLeft size={16} />
            </button>

            <button
              type="button"
              className="app-sidebar-btn d-lg-none"
              title="Закрити меню"
              onClick={onCloseMobile}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Таби: «Кімнати» / «Користувачі». Займають усе місце від верху
            панелі (або від мобільного хедера) до футера. */}
        <div className="app-sidebar-tabs">

          <div className="app-sidebar-tabs-nav">
            {MAIN_TABS.map((tab, index) => {
              const Icon = tab.icon;
              // .app-sidebar-inner (батьківський скрол-контейнер) має
              // overflow-x: hidden — тултип по центру першого/останнього
              // табу міг би вилізти за межу і обрізатись, тому крайні
              // таби прив'язують тултип до внутрішнього краю замість
              // центру (див. _sidebar.css).
              const edgeClass =
                index === 0
                  ? "is-align-start"
                  : index === MAIN_TABS.length - 1
                    ? "is-align-end"
                    : "";
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`app-sidebar-tab-btn ${activeTab === tab.id ? "is-active" : ""}`}
                  aria-label={tab.label}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={16} className="app-sidebar-tab-icon" />
                  <span className="app-sidebar-tab-label">{tab.label}</span>
                  {/* Власний тултип замість нативного title: title
                      з'являється із затримкою, стилізується браузером
                      по-різному і його рендер поверх сторінки не
                      гарантований (у деяких браузерах перекривається
                      іншими елементами з власним stacking context) —
                      цей же завжди належний DOM-елемент з явним
                      z-index (див. _sidebar.css). Не показуємо для
                      активного табу — там підпис і так видно поруч
                      з іконкою. */}
                  <span className={`app-sidebar-tab-tooltip ${edgeClass}`}>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <SimpleBar className="app-sidebar-tabs-body app-scrollbar no-horizontal">

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

            {activeTab === "friends" && <FriendsList />}

            {activeTab === "blocked" && <BlockedUsersList />}
          </SimpleBar>
        </div>

        {/* Футер панелі: замість ніка (він і так завжди видно в шапці
            чата, див. ChatHeader) — посилання на допоміжні модалки,
            завжди доступні незалежно від того, в якій кімнаті/вкладці
            зараз користувач. Кнопку згортання перенесено нагору, див.
            app-sidebar-top вище. */}
        <div className="app-sidebar-footer">
          <a
            href="#"
            className="app-sidebar-footer-link"
            data-bs-toggle="modal"
            data-bs-target={`#${RULES_MODAL_ID}`}
            onClick={(e) => e.preventDefault()}
          >
            Правила
          </a>

          <a
            href="#"
            className="app-sidebar-footer-link"
            data-bs-toggle="modal"
            data-bs-target={`#${SAFETY_WARNING_MODAL_ID}`}
            onClick={(e) => e.preventDefault()}
          >
            Попередження про безпеку
          </a>

          <a
            href="#"
            className="app-sidebar-footer-link"
            data-bs-toggle="modal"
            data-bs-target={`#${FEEDBACK_MODAL_ID}`}
            onClick={(e) => e.preventDefault()}
          >
            Зворотний зв&apos;язок
          </a>
        </div>
      </div>

      <RulesModal modalId={RULES_MODAL_ID} />
      <SafetyWarningModal modalId={SAFETY_WARNING_MODAL_ID} />
      <FeedbackModal modalId={FEEDBACK_MODAL_ID} />
    </aside>
  );
}