import { useDmStore } from "@features/dm";
import { RoomsPanel } from "@widgets/side-panel";
import { DialogsList } from "@widgets/private-chat";
import { CHAT_FILTERS, useLeftSidebarStore } from "@shared/lib/leftSidebarStore.js";

const FILTERS = [
  { id: CHAT_FILTERS.ALL, label: "Усі" },
  { id: CHAT_FILTERS.ROOMS, label: "Кімнати" },
  { id: CHAT_FILTERS.DIALOGS, label: "Особисті" },
];

/**
 * ChatsPanel — вкладка "Чати": три підтаби.
 *  - "Усі": кімнати зверху, діалоги знизу (дві незалежно прокручувані половини);
 *  - "Кімнати": лише список кімнат;
 *  - "Особисті": лише список особистих діалогів.
 */
export function ChatsPanel({ activeRoom, roomCounts, onSelectRoom, onOpenDialog }) {
  const filter = useLeftSidebarStore((state) => state.chatsFilter);
  const setFilter = useLeftSidebarStore((state) => state.setChatsFilter);

  const dmUnread = useDmStore((state) =>
    Object.values(state.conversations).reduce(
      (sum, convo) => sum + (convo.unreadCount || 0),
      0,
    ),
  );

  const rooms = (
    <RoomsPanel
      activeRoom={activeRoom}
      roomCounts={roomCounts}
      onSelectRoom={onSelectRoom}
    />
  );
  const dialogs = <DialogsList onOpen={onOpenDialog} />;

  return (
    <>
      <div className="chats-filter" role="tablist" aria-label="Фільтр чатів">
        {FILTERS.map(({ id, label }) => {
          const isActive = id === filter;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`chats-filter-btn${isActive ? " is-active" : ""}`}
              onClick={() => setFilter(id)}
            >
              {label}
              {id === CHAT_FILTERS.DIALOGS && dmUnread > 0 && (
                <span className="badge bg-danger ms-1">
                  {dmUnread > 99 ? "99+" : dmUnread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filter === CHAT_FILTERS.ROOMS && rooms}
      {filter === CHAT_FILTERS.DIALOGS && dialogs}
      {filter === CHAT_FILTERS.ALL && (
        <>
          <section className="chats-section" aria-label="Кімнати">
            <h6 className="chats-section-title">Кімнати</h6>
            {rooms}
          </section>
          <section className="chats-section" aria-label="Особисті">
            <h6 className="chats-section-title">Особисті</h6>
            {dialogs}
          </section>
        </>
      )}
    </>
  );
}
