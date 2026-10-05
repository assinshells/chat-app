import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { useFriendStore, FriendsList } from "@features/friends";
import { useBlockStore, BlockedUsersList } from "@features/block";
import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { getStatusLabel } from "@shared/constants/status.constants.js";
import { StatusIcon } from "@shared/ui/status-icon";
import { useIsDarkTheme } from "@shared/lib/theme.js";
import { AppScrollbar } from "@shared/ui/scrollbar";

// Групи за статтю (значення gender збігаються з backend GENDER_VALUES);
// група без match — "Інші": "unknown" і будь-яке невідоме/порожнє значення.
const GENDER_GROUPS = [
  { key: "male", label: "Чоловіки", match: "male" },
  { key: "female", label: "Жінки", match: "female" },
  { key: "other", label: "Інші", match: null },
];
const KNOWN_GENDERS = new Set(["male", "female"]);

/**
 * UsersPanel — учасники поточної кімнати, розділені за статтю:
 * "Чоловіки (N)", "Жінки (N)", "Інші (N)" (стать не вказано). Кожна
 * група розкривається/згортається кліком по заголовку (шеврон справа).
 * Усередині групи друзі йдуть першими (жирним), решта — за алфавітом.
 *
 * Після груп за статтю в кінці вкладки йдуть персональні списки
 * "Друзі (N)" і "Заблоковані (N)" (раніше були в налаштуваннях профілю).
 *
 * Клік по ніку додає людину адресатом у форму повідомлення
 * (onNicknameClick), меню дій (особисте, друзі, блокування, модерація) відкривається
 * кнопкою "три крапки" у формі повідомлення, коли нік додано.
 */
export function UsersPanel({
  login,
  users,
  selectedNicknames = [],
  onNicknameClick,
}) {
  const friendLogins = useFriendStore((state) => state.friendLogins);
  const friendsCount = useFriendStore((state) => state.friends.length);
  const blockedCount = useBlockStore((state) => state.blocked.length);
  const isDarkTheme = useIsDarkTheme();

  // Стан розгортання груп: за замовчуванням групи за статтю розгорнуті,
  // "Друзі" і "Заблоковані" — згорнуті. Явно змінені користувачем значення
  // лишаються, навіть якщо група тимчасово зникає (порожня).
  const [expanded, setExpanded] = useState({});
  const isExpanded = (key, defaultOpen = true) => expanded[key] ?? defaultOpen;
  const toggleGroup = (key, defaultOpen = true) =>
    setExpanded((prev) => ({ ...prev, [key]: !(prev[key] ?? defaultOpen) }));

  const groups = useMemo(() => {
    // Друзі першими, далі за алфавітом.
    const sorted = [...users].sort((a, b) => {
      const friendDiff =
        Number(friendLogins.has(b.login)) - Number(friendLogins.has(a.login));
      return friendDiff || a.login.localeCompare(b.login);
    });

    return GENDER_GROUPS.map((group) => ({
      ...group,
      users: sorted.filter((user) =>
        group.match ? user.gender === group.match : !KNOWN_GENDERS.has(user.gender),
      ),
    })).filter((group) => group.users.length > 0);
  }, [users, friendLogins]);

  const renderUser = (user) => {
    const isOwn = user.login === login;
    const isSelected = selectedNicknames.includes(user.login);
    const isFriendUser = friendLogins.has(user.login);

    return (
      <div key={user.id ?? user.login} className="app-sidebar-online-item">
        {isOwn ? (
          <span className="app-sidebar-online-name nickname-own">
            <span
              className="app-sidebar-status-emoji"
              title={getStatusLabel(user.status)}
            >
              <StatusIcon status={user.status} />
            </span>
            {user.login}
          </span>
        ) : (
          <>
            <button
              type="button"
              className={`app-sidebar-online-name app-sidebar-online-name-btn ${
                isSelected ? "is-selected" : ""
              } ${isFriendUser ? "is-friend" : ""}`}
              title={`${isFriendUser ? "Друг · " : ""}${getStatusLabel(
                user.status,
              )} · Додати користувача у форму повідомлення`}
              style={{ "--user-color": getEffectiveColorHex(user.color, isDarkTheme) }}
              onClick={() => onNicknameClick?.(user.login)}
            >
              <span className="app-sidebar-status-emoji">
                <StatusIcon status={user.status} />
              </span>
              {user.login}
            </button>
          </>
        )}
      </div>
    );
  };

  // Заголовок-кнопка розкривного списку: назва (N) і шеврон наприкінці.
  const renderGroup = ({ key, label, count, defaultOpen = true, children }) => {
    const open = isExpanded(key, defaultOpen);
    return (
      <div key={key} className="app-panel-group">
        <button
          type="button"
          className="app-panel-group-toggle"
          aria-expanded={open}
          onClick={() => toggleGroup(key, defaultOpen)}
        >
          <span className="app-panel-group-toggle-label">
            {label} ({count})
          </span>
          <ChevronDown
            size={16}
            className={`app-panel-group-chevron ${open ? "is-open" : ""}`}
          />
        </button>
        {open && children}
      </div>
    );
  };

  const isEmpty = groups.length === 0;

  return (
    <>
      <AppScrollbar className="app-panel-scroll">
        {isEmpty ? (
          <div className="app-sidebar-empty">
            У кімнаті поки нікого немає
          </div>
        ) : (
          <div className="app-sidebar-list">
            {groups.map((group) =>
              renderGroup({
                key: group.key,
                label: group.label,
                count: group.users.length,
                children: group.users.map(renderUser),
              }),
            )}
          </div>
        )}

        {/* Персональні списки — завжди в кінці, після всіх груп. */}
        <div className="app-sidebar-list">
          {renderGroup({
            key: "friends",
            label: "Друзі",
            count: friendsCount,
            defaultOpen: false,
            children: <FriendsList />,
          })}
          {renderGroup({
            key: "blocked",
            label: "Заблоковані",
            count: blockedCount,
            defaultOpen: false,
            children: <BlockedUsersList />,
          })}
        </div>
      </AppScrollbar>
    </>
  );
}
