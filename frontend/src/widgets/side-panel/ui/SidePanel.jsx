import { useState } from "react";
import { X } from "lucide-react";

import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";
import { useSidePanelStore } from "@shared/lib/sidePanelStore.js";
import { UserProfileView } from "./UserProfileView.jsx";

/**
 * SidePanel — права панель з профілем іншого користувача (режим
 * "userProfile" у useSidePanelStore). Решта розділів (кімнати,
 * користувачі, особисті, галерея, профіль, налаштування) живуть у
 * вкладках лівої рейки (@widgets/left-sidebar). На десктопі це колонка
 * поруч із чатом, на телефоні — на весь екран.
 *
 * Нік у шапці — кольором самого користувача (з учасників кімнати, а
 * якщо вже вийшов — з відповіді профілю).
 */
export function SidePanel({ onClose, users }) {
  const isDarkTheme = useIsDarkTheme();
  const userProfileLogin = useSidePanelStore((state) => state.userProfileLogin);
  const [loadedProfile, setLoadedProfile] = useState(null);

  const title = userProfileLogin ?? "Профіль";
  const color =
    users.find((user) => user.login === userProfileLogin)?.color ??
    (loadedProfile?.login === userProfileLogin ? loadedProfile.color : null);

  return (
    <aside className="app-panel" aria-label={title}>
      <div className="app-panel-header">
        <h5
          className="app-panel-title"
          style={{ color: getEffectiveColorHex(color, isDarkTheme) }}
        >
          {title}
        </h5>

        <button
          type="button"
          className="chat-header-btn"
          title="Закрити"
          aria-label="Закрити панель"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      <div className="app-panel-body">
        <UserProfileView login={userProfileLogin} onLoaded={setLoadedProfile} />
      </div>
    </aside>
  );
}
