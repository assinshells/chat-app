import { useMemo } from "react";

import { DmTriggerButton } from "@features/dm";
import { useFriendStore } from "@features/friends/model/useFriendStore.js";
import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { getStatusEmoji, getStatusLabel } from "@shared/constants/status.constants.js";
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
 * "Чоловіки (N)", "Жінки (N)", "Інші (N)" (стать не вказано). Усередині
 * кожної групи друзі йдуть першими (жирним), решта — за алфавітом.
 *
 * Клік по ніку додає людину адресатом у форму повідомлення
 * (onNicknameClick), кнопка зліва від ніка (DmTriggerButton) відкриває
 * меню дій: написати особисте, друзі, блокування, модерація.
 */
export function UsersPanel({
  login,
  users,
  activeRoom,
  selectedNicknames = [],
  onNicknameClick,
}) {
  const friendLogins = useFriendStore((state) => state.friendLogins);
  const isDarkTheme = useIsDarkTheme();

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
              aria-hidden="true"
            >
              {getStatusEmoji(user.status)}
            </span>
            {user.login}
          </span>
        ) : (
          <>
            <DmTriggerButton login={user.login} color={user.color} room={activeRoom} />
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
              <span className="app-sidebar-status-emoji" aria-hidden="true">
                {getStatusEmoji(user.status)}
              </span>
              {user.login}
            </button>
          </>
        )}
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
            {groups.map((group) => (
              <div key={group.key}>
                <div className="app-panel-group-label">
                  {group.label} ({group.users.length})
                </div>
                {group.users.map(renderUser)}
              </div>
            ))}
          </div>
        )}
      </AppScrollbar>
    </>
  );
}
