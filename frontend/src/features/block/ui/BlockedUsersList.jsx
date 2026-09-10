import { UserX } from "lucide-react";

import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";
import { useBlockStore } from "@features/block/model/useBlockStore.js";

/**
 * BlockedUsersList — вкладка "Заблоковані" в сайдбарі (див. Sidebar.jsx,
 * MAIN_TABS). Показує всіх, кого поточний користувач заблокував (див.
 * DmTriggerButton -> "Заблокувати"), з можливістю розблокувати назад.
 * Список персональний — це не модерація, тому видно лише власні
 * блокування, без прив'язки до кімнати.
 */
export function BlockedUsersList() {
  const blocked = useBlockStore((state) => state.blocked);
  const loading = useBlockStore((state) => state.loading);
  const unblockUser = useBlockStore((state) => state.unblockUser);

  const isDarkTheme = useIsDarkTheme();

  if (loading && blocked.length === 0) {
    return <div className="app-sidebar-empty">Завантаження…</div>;
  }

  if (blocked.length === 0) {
    return <div className="app-sidebar-empty">Немає заблокованих користувачів</div>;
  }

  return (
    <div className="app-sidebar-list">
      {blocked.map((user) => (
        <div key={user.login} className="app-sidebar-online-item">
          <span
            className="app-sidebar-online-name"
            style={{ color: getEffectiveColorHex(user.color, isDarkTheme) }}
          >
            {user.login}
          </span>
          <button
            type="button"
            className="app-sidebar-unblock-btn"
            title="Розблокувати"
            onClick={() => unblockUser(user.login)}
          >
            <UserX size={14} />
            <span>Розблокувати</span>
          </button>
        </div>
      ))}
    </div>
  );
}
