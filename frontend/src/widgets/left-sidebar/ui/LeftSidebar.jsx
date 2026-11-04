import { X } from "lucide-react";

import { LEFT_TABS } from "@shared/lib/leftSidebarStore.js";
import { UsersPanel } from "@widgets/side-panel";
import { RoomsPanel } from "./RoomsPanel.jsx";

/**
 * LeftSidebar — лівий сайдбар на всю висоту поруч із рейкою. Вміст
 * залежить від активного pill-таба рейки: список кімнат або список
 * учасників (з друзями й заблокованими). На телефоні виїжджає поверх
 * чату праворуч від рейки.
 */
export function LeftSidebar({
  tab,
  onClose,
  login,
  users,
  activeRoom,
  activeRoomName,
  roomCounts,
  selectedNicknames,
  onSelectRoom,
  onNicknameClick,
}) {
  if (!tab) return null;

  const title =
    tab === LEFT_TABS.ROOMS
      ? "Кімнати"
      : `У кімнаті${activeRoomName ? ` «${activeRoomName}»` : ""}: ${users.length}`;

  return (
    <aside
      className="left-sidebar"
      role="tabpanel"
      id={`left-pane-${tab}`}
      aria-labelledby={`left-tab-${tab}`}
    >
      <div className="app-panel-header">
        <h5 className="app-panel-title">{title}</h5>

        <button
          type="button"
          className="chat-header-btn left-sidebar-close"
          title="Згорнути"
          aria-label="Згорнути панель"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      <div className="app-panel-body">
        {tab === LEFT_TABS.ROOMS && (
          <RoomsPanel
            activeRoom={activeRoom}
            roomCounts={roomCounts}
            onSelectRoom={onSelectRoom}
          />
        )}

        {tab === LEFT_TABS.USERS && (
          <UsersPanel
            login={login}
            users={users}
            selectedNicknames={selectedNicknames}
            onNicknameClick={onNicknameClick}
          />
        )}
      </div>
    </aside>
  );
}
