import { RoomsPanel, UsersPanel } from "@widgets/side-panel";
import { SIDEBAR_TABS, useRightSidebarStore } from "@shared/lib/rightSidebarStore.js";

const TABS = [
  { id: SIDEBAR_TABS.ALL, label: "Усі" },
  { id: SIDEBAR_TABS.ROOMS, label: "Кімнати" },
  { id: SIDEBAR_TABS.USERS, label: "Користувачі" },
];

/**
 * RoomsUsersPanel — вміст правого сайдбара: три вкладки.
 *  - "Усі": кімнати зверху (30% висоти), користувачі знизу (70%), кожна
 *    половина прокручується окремо;
 *  - "Кімнати": лише список кімнат;
 *  - "Користувачі": лише учасники поточної кімнати.
 * На телефоні той самий вміст показується у вкладці "Чати" лівої рейки.
 */
export function RoomsUsersPanel({
  login,
  users,
  activeRoom,
  activeRoomName,
  roomCounts,
  selectedNicknames,
  onSelectRoom,
  onNicknameClick,
}) {
  const tab = useRightSidebarStore((state) => state.tab);
  const setTab = useRightSidebarStore((state) => state.setTab);

  const usersTitle = `У кімнаті${activeRoomName ? ` «${activeRoomName}»` : ""}: ${users.length}`;

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
      </div>

      {tab === SIDEBAR_TABS.ROOMS && rooms}
      {tab === SIDEBAR_TABS.USERS && usersList}
      {tab === SIDEBAR_TABS.ALL && (
        <>
          <section className="sidebar-split sidebar-split-top" aria-label="Кімнати">
            <h6 className="sidebar-split-title">Кімнати</h6>
            {rooms}
          </section>
          <section className="sidebar-split sidebar-split-bottom" aria-label="Користувачі">
            <h6 className="sidebar-split-title">{usersTitle}</h6>
            {usersList}
          </section>
        </>
      )}
    </>
  );
}
