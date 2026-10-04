import { useMemo, useState } from "react";

import { DmTriggerButton } from "@features/dm";
import { useFriendStore } from "@features/friends/model/useFriendStore.js";
import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { getStatusEmoji, getStatusLabel } from "@shared/constants/status.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";

/**
 * UsersPanel — учасники поточної кімнати: один список із пошуком.
 * Друзі йдуть першими (жирним), решта — за алфавітом.
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
  const [query, setQuery] = useState("");
  const friendLogins = useFriendStore((state) => state.friendLogins);
  const isDarkTheme = useIsDarkTheme();

  const { friends, others } = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const sorted = users
      .filter((user) => !normalized || user.login.toLowerCase().includes(normalized))
      .sort((a, b) => a.login.localeCompare(b.login));

    return {
      friends: sorted.filter((user) => friendLogins.has(user.login)),
      others: sorted.filter((user) => !friendLogins.has(user.login)),
    };
  }, [users, query, friendLogins]);

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

  const isEmpty = friends.length === 0 && others.length === 0;

  return (
    <>
      <div className="app-panel-search">
        <input
          type="search"
          className="form-control form-control-sm"
          placeholder="Пошук серед учасників"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Пошук серед учасників"
        />
      </div>

      <div className="app-panel-scroll">
        {isEmpty ? (
          <div className="app-sidebar-empty">
            {query ? "Нікого не знайдено" : "У кімнаті поки нікого немає"}
          </div>
        ) : (
          <div className="app-sidebar-list">
            {friends.length > 0 && (
              <>
                <div className="app-panel-group-label">Друзі · {friends.length}</div>
                {friends.map(renderUser)}
              </>
            )}
            {others.length > 0 && (
              <>
                {friends.length > 0 && (
                  <div className="app-panel-group-label">Інші · {others.length}</div>
                )}
                {others.map(renderUser)}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
