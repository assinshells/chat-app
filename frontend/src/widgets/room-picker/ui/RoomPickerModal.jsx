import { createPortal } from "react-dom";

import { AppScrollbar } from "@shared/ui/scrollbar";
import { ROOMS } from "@features/chat/constants/rooms.constants.js";

export const ROOM_PICKER_MODAL_ID = "roomPickerModal";

// Тематичні кімнати йдуть першими, решта — міста за алфавітом
// (порядок у ROOMS уже алфавітний).
const THEMATIC_ROOM_IDS = ["general", "dating", "sex", "lgbt", "bespredel"];

const THEMATIC_ROOMS = ROOMS.filter((room) => THEMATIC_ROOM_IDS.includes(room.id));
const CITY_ROOMS = ROOMS.filter((room) => !THEMATIC_ROOM_IDS.includes(room.id));

/**
 * RoomPickerModal — вибір кімнати прямо з чату. Відкривається кліком по
 * назві кімнати в шапці (ChatHeader, data-bs-toggle="modal"). Клік по
 * кімнаті одразу перемикає її і закриває вікно (data-bs-dismiss).
 * На телефоні — на весь екран (modal-fullscreen-sm-down).
 *
 * Біля кожної кімнати — кількість людей онлайн; у шапці — загальна
 * кількість людей у чаті (сума по всіх кімнатах).
 */
export function RoomPickerModal({
  modalId = ROOM_PICKER_MODAL_ID,
  activeRoom,
  roomCounts,
  onSelectRoom,
}) {
  const renderRoom = (room) => (
    <button
      key={room.id}
      type="button"
      className={`room-select-item room-picker-item ${
        room.id === activeRoom ? "is-active" : ""
      }`}
      data-bs-dismiss="modal"
      onClick={() => onSelectRoom?.(room.id)}
    >
      <span className="room-picker-name">{room.name}</span>
      <span className="room-picker-count">{roomCounts?.[room.id] ?? 0}</span>
    </button>
  );

  const totalOnline = Object.values(roomCounts ?? {}).reduce(
    (sum, count) => sum + (Number(count) || 0),
    0,
  );

  return createPortal(
    <div
      className="modal fade"
      id={modalId}
      tabIndex="-1"
      aria-labelledby={`${modalId}Label`}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down room-picker-dialog">
        <div className="modal-content app-modal">
          <div className="modal-header">
            <div className="room-picker-heading">
              <h5 className="modal-title" id={`${modalId}Label`}>
                Оберіть кімнату
              </h5>
              <span className="room-picker-total">У чаті: {totalOnline}</span>
            </div>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Закрити"
            />
          </div>

          <div className="modal-body room-picker-body">
            <AppScrollbar>
              <h6 className="room-picker-group-label">Тематичні</h6>
              <div className="room-select-grid room-picker-grid">
                {THEMATIC_ROOMS.map(renderRoom)}
              </div>

              <h6 className="room-picker-group-label">Міста</h6>
              <div className="room-select-grid room-picker-grid">
                {CITY_ROOMS.map(renderRoom)}
              </div>
            </AppScrollbar>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
