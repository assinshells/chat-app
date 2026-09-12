import { UserMinus } from "lucide-react";

import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";
import { useFriendStore } from "@features/friends/model/useFriendStore.js";

/**
 * FriendsList — вкладка "Друзі" в сайдбарі (див. Sidebar.jsx,
 * MAIN_TABS). Показує всіх, кого поточний користувач додав до друзів
 * (див. DmTriggerButton -> "Додати до друзів"), з можливістю видалити
 * назад. Список персональний — видно лише власні додавання, без
 * прив'язки до кімнати і без підтвердження з боку іншої сторони (той
 * самий принцип, що й BlockedUsersList.jsx).
 */
export function FriendsList() {
  const friends = useFriendStore((state) => state.friends);
  const loading = useFriendStore((state) => state.loading);
  const removeFriend = useFriendStore((state) => state.removeFriend);

  const isDarkTheme = useIsDarkTheme();

  if (loading && friends.length === 0) {
    return <div className="app-sidebar-empty">Завантаження…</div>;
  }

  if (friends.length === 0) {
    return <div className="app-sidebar-empty">Немає друзів</div>;
  }

  return (
    <div className="app-sidebar-list">
      {friends.map((user) => (
        <div key={user.login} className="app-sidebar-online-item">
          <span
            className="app-sidebar-online-name"
            style={{ color: getEffectiveColorHex(user.color, isDarkTheme) }}
          >
            {user.login}
          </span>
          <button
            type="button"
            className="app-sidebar-unfriend-btn"
            title="Видалити з друзів"
            onClick={() => removeFriend(user.login)}
          >
            <UserMinus size={14} />
            <span>Видалити</span>
          </button>
        </div>
      ))}
    </div>
  );
}
