import { createPortal } from "react-dom";

import { ROOMS } from "@features/chat/constants/rooms.constants.js";

/**
 * RoomSelectModal — замінює <select id="roomSelect"> на формі входу
 * (LoginForm.jsx). Той самий патерн порталу/Bootstrap-модалки, що й
 * інші модалки застосунку (DeveloperModal/RulesModal): .modal-header
 * лишається технічно (щоб data-bs-dismiss на хрестику коректно
 * закривав модалку), але візуально — без заголовка, без рамки й фону
 * (developer-modal-header), лишається лише хрестик у кутку. Футера
 * нема: клік по кімнаті одразу обирає її (onConfirm) і закриває
 * модалку (data-bs-dismiss прямо на кнопці кімнати) — окремої кнопки
 * підтвердження не потрібно.
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
      data-bs-backdrop="static"
    >
      <div className="modal-dialog modal-dialog-centered room-select-modal-dialog">
        <div className="modal-content app-modal">
          <div className="modal-header developer-modal-header">
            <button
              type="button"
              className="btn-close ms-auto"
              data-bs-dismiss="modal"
              aria-label="Закрити"
            />
          </div>

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
