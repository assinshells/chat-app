import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";

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
 * Біля кожної кімнати — кількість людей онлайн; зверху пошук.
 */
export function RoomPickerModal({
  modalId = ROOM_PICKER_MODAL_ID,
  activeRoom,
  roomCounts,
  onSelectRoom,
}) {
  const [query, setQuery] = useState("");

  // Закрили вікно — наступне відкриття починається з чистого пошуку.
  useEffect(() => {
    const element = document.getElementById(modalId);
    if (!element) return undefined;

    const handleHidden = () => setQuery("");
    element.addEventListener("hidden.bs.modal", handleHidden);
    return () => element.removeEventListener("hidden.bs.modal", handleHidden);
  }, [modalId]);

  const normalizedQuery = query.trim().toLowerCase();

  const found = useMemo(
    () =>
      normalizedQuery
        ? ROOMS.filter((room) => room.name.toLowerCase().includes(normalizedQuery))
        : null,
    [normalizedQuery],
  );

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
            <h5 className="modal-title" id={`${modalId}Label`}>
              Оберіть кімнату
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Закрити"
            />
          </div>

          <div className="modal-body room-picker-body">
            <div className="room-picker-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                className="form-control form-control-sm"
                placeholder="Пошук кімнати"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Пошук кімнати"
              />
            </div>

            <AppScrollbar>
              {found ? (
                found.length === 0 ? (
                  <p className="room-picker-empty">Кімнату не знайдено</p>
                ) : (
                  <div className="room-select-grid room-picker-grid">
                    {found.map(renderRoom)}
                  </div>
                )
              ) : (
                <>
                  <h6 className="room-picker-group-label">Тематичні</h6>
                  <div className="room-select-grid room-picker-grid">
                    {THEMATIC_ROOMS.map(renderRoom)}
                  </div>

                  <h6 className="room-picker-group-label">Міста</h6>
                  <div className="room-select-grid room-picker-grid">
                    {CITY_ROOMS.map(renderRoom)}
                  </div>
                </>
              )}
            </AppScrollbar>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
