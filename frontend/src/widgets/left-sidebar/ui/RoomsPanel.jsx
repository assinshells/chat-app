import { AppScrollbar } from "@shared/ui/scrollbar";
import { ROOMS } from "@features/chat/constants/rooms.constants.js";

// Тематичні кімнати йдуть першими, решта — міста (порядок у ROOMS
// уже алфавітний).
const THEMATIC_ROOM_IDS = ["general", "dating", "sex", "lgbt", "bespredel"];

const THEMATIC_ROOMS = ROOMS.filter((room) =>
  THEMATIC_ROOM_IDS.includes(room.id),
);
const CITY_ROOMS = ROOMS.filter((room) => !THEMATIC_ROOM_IDS.includes(room.id));

/**
 * RoomsPanel — список кімнат у лівому сайдбарі (раніше був модалкою
 * RoomPickerModal). Біля кожної кімнати — кількість людей онлайн.
 */
export function RoomsPanel({ activeRoom, roomCounts, onSelectRoom }) {
  const renderRoom = (room) => (
    <button
      key={room.id}
      type="button"
      className={`left-room-item ${room.id === activeRoom ? "is-active" : ""}`}
      aria-current={room.id === activeRoom ? "true" : undefined}
      onClick={() => onSelectRoom?.(room.id)}
    >
      <span className="left-room-hash" aria-hidden="true">
        #
      </span>
      <span className="left-room-name">{room.name}</span>
      <span className="left-room-count">{roomCounts?.[room.id] ?? 0}</span>
    </button>
  );

  return (
    <AppScrollbar className="app-panel-scroll">
      <h6 className="left-sidebar-group-label">Тематичні</h6>
      <div className="left-room-list">{THEMATIC_ROOMS.map(renderRoom)}</div>

      <h6 className="left-sidebar-group-label">Міста</h6>
      <div className="left-room-list">{CITY_ROOMS.map(renderRoom)}</div>
    </AppScrollbar>
  );
}
