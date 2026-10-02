import { createPortal } from "react-dom";

import { ROOMS } from "@features/chat/constants/rooms.constants.js";

/**
 * RoomSelectModal — замінює <select id="roomSelect"> на формі входу
 * (LoginForm.jsx). Без шапки, хрестика й футера: клік по кімнаті одразу
 * обирає її (onConfirm) і закриває модалку (data-bs-dismiss на кнопці
 * кімнати). Закрити без вибору можна кліком поза модалкою або Esc.
 */
export function RoomSelectModal({
  modalId = "loginRoomSelectModal",
  room,
  onConfirm,
}) {
  return createPortal(
    <div
      className="modal fade"
      id={modalId}
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="true"
    >
      <div className="modal-dialog modal-dialog-centered room-select-modal-dialog">
        <div className="modal-content app-modal">
          <div className="modal-body room-select-modal-body">
            <div className="room-select-grid">
              {ROOMS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`room-select-item ${
                    r.id === room ? "is-active" : ""
                  }`}
                  data-bs-dismiss="modal"
                  onClick={() => onConfirm?.(r.id)}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
