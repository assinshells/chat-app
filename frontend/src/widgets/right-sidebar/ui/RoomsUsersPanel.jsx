import { X } from "lucide-react";

import { RoomsPanel, UsersPanel } from "@widgets/side-panel";
import { SIDEBAR_TABS, useRightSidebarStore } from "@shared/lib/rightSidebarStore.js";

const TABS = [
  { id: SIDEBAR_TABS.ROOMS, label: "Кімнати" },
  { id: SIDEBAR_TABS.USERS, label: "Користувачі" },
];

/**
 * RoomsUsersPanel — вміст правого сайдбара: дві вкладки.
 *  - "Кімнати": список кімнат;
 *  - "Користувачі": учасники поточної кімнати.
 * onClose — лише на телефоні (сайдбар висувний): хрестик у ряду вкладок.
 */
export function RoomsUsersPanel({
  login,
  users,
  activeRoom,
  roomCounts,
  selectedNicknames,
  onSelectRoom,
  onNicknameClick,
  onClose,
}) {
  const tab = useRightSidebarStore((state) => state.tab);
  const setTab = useRightSidebarStore((state) => state.setTab);

  const rooms = (
    <RoomsPanel
      activeRoom={activeRoom}
      roomCounts={roomCounts}
      onSelectRoom={onSelectRoom}
    />
  );
  const usersList = (
    <UsersPanel
      login={login}
      users={users}
      selectedNicknames={selectedNicknames}
      onNicknameClick={onNicknameClick}
    />
  );

  return (
    <>
      <div className="sidebar-tabs" role="tablist" aria-label="Кімнати і користувачі">
        {TABS.map(({ id, label }) => {
          const isActive = id === tab;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`sidebar-tab${isActive ? " is-active" : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          );
        })}

        {onClose && (
          <button
            type="button"
            className="chat-header-btn sidebar-close d-lg-none"
            title="Закрити"
            aria-label="Закрити"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {tab === SIDEBAR_TABS.ROOMS && rooms}
      {tab === SIDEBAR_TABS.USERS && usersList}
    </>
  );
}
