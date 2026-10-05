import { useState } from "react";
import { ArrowLeft, X } from "lucide-react";

import { useDmStore } from "@features/dm";
import { PrivateMessagesPanel } from "@widgets/private-chat";
import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";
import { SIDE_PANELS, useSidePanelStore } from "@shared/lib/sidePanelStore.js";
import { UsersPanel } from "./UsersPanel.jsx";
import { ProfilePanel } from "./ProfilePanel.jsx";
import { UserProfileView } from "./UserProfileView.jsx";

/**
 * SidePanel — єдина права панель чату: "Учасники", "Особисті
 * повідомлення", "Профіль" або профіль іншого користувача (який саме режим — вирішує
 * useSidePanelStore). На десктопі це колонка поруч із чатом (чат
 * лишається доступним), на телефоні — на весь екран під навбаром.
 */
export function SidePanel({
  panel,
  onClose,
  login,
  users,
  activeRoom,
  selectedNicknames,
  onNicknameClick,
  currentUserStatus,
  onStatusChange,
  logoutModalId,
}) {
  const isDarkTheme = useIsDarkTheme();

  const dmPeerLogin = useDmStore((state) => state.panelLogin);
  const dmPeer = useDmStore((state) =>
    state.panelLogin ? state.conversations[state.panelLogin] : null,
  );
  const closeConversation = useDmStore((state) => state.closeConversation);

  // Профіль іншого користувача: нік у шапці — кольором самого користувача
  // (з учасників кімнати, а якщо вже вийшов — з відповіді профілю).
  const userProfileLogin = useSidePanelStore((state) => state.userProfileLogin);
  const [loadedProfile, setLoadedProfile] = useState(null);

  const isDmConversation = panel === SIDE_PANELS.DM && Boolean(dmPeerLogin);

  const isProfile = panel === SIDE_PANELS.PROFILE;

  let title = login ?? "Профіль";
  let titleStyle;
  if (isProfile) {
    // Логін як заголовок: лише поточний колір ніка, шрифт — стандартний.
    titleStyle = {
      color: getEffectiveColorHex(
        users.find((user) => user.login === login)?.color,
        isDarkTheme,
      ),
    };
  } else if (panel === SIDE_PANELS.USERS) {
    title = `У кімнаті: ${users.length}`;
  } else if (panel === SIDE_PANELS.USER_PROFILE) {
    title = userProfileLogin ?? "Профіль";
    const color =
      users.find((user) => user.login === userProfileLogin)?.color ??
      (loadedProfile?.login === userProfileLogin ? loadedProfile.color : null);
    titleStyle = { color: getEffectiveColorHex(color, isDarkTheme) };
  } else if (panel === SIDE_PANELS.DM) {
    title = dmPeerLogin ?? "Особисті повідомлення";
    if (dmPeerLogin) {
      titleStyle = { color: getEffectiveColorHex(dmPeer?.color, isDarkTheme) };
    }
  }

  return (
    <aside className="app-panel" aria-label={title}>
      <div className="app-panel-header">
        {isDmConversation && (
          <button
            type="button"
            className="chat-header-btn"
            title="Назад до діалогів"
            aria-label="Назад до діалогів"
            onClick={closeConversation}
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <h5 className="app-panel-title" style={titleStyle}>
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
        {panel === SIDE_PANELS.USERS && (
          <UsersPanel
            login={login}
            users={users}
            activeRoom={activeRoom}
            selectedNicknames={selectedNicknames}
            onNicknameClick={onNicknameClick}
          />
        )}

        {panel === SIDE_PANELS.DM && <PrivateMessagesPanel />}

        {panel === SIDE_PANELS.USER_PROFILE && (
          <UserProfileView login={userProfileLogin} onLoaded={setLoadedProfile} />
        )}

        {panel === SIDE_PANELS.PROFILE && (
          <ProfilePanel
            currentUserStatus={currentUserStatus}
            onStatusChange={onStatusChange}
            logoutModalId={logoutModalId}
          />
        )}
      </div>
    </aside>
  );
}
