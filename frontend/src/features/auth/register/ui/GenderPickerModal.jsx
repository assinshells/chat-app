import { createPortal } from "react-dom";
import { GENDER_OPTIONS } from "@shared/constants/auth.constants.js";

/**
 * GenderPickerModal — вибір статі винесено сюди з форми реєстрації
 * (RegisterForm.jsx), в окрему модалку — той самий "безшапковий" патерн,
 * що й ColorPickerModal.jsx (і RoomSelectModal/DeveloperModal): без
 * заголовка й футера, лишається лише хрестик закриття.
 *
 * На відміну від ColorPickerModal (де вибір — чернетка, застосовується
 * лише по кнопці "Прийняти"), тут — той самий патерн, що й
 * RoomSelectModal на формі входу: клік по варіанту одразу застосовує
 * вибір (onConfirm) і закриває модалку (data-bs-dismiss прямо на
 * кнопці варіанту), окремої кнопки підтвердження не потрібно. У тілі —
 * лише самі варіанти, без додаткового підпису обраного значення під
 * ними: активний варіант і так підсвічений (.is-active).
 */
export function GenderPickerModal({ modalId = "genderPickerModal", gender, onConfirm }) {
  return createPortal(
    <div
      className="modal fade"
      id={modalId}
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content app-modal">
          <div className="modal-header developer-modal-header">
            <button
              type="button"
              className="btn-close ms-auto"
              data-bs-dismiss="modal"
              aria-label="Закрити"
            />
          </div>

          <div className="modal-body gender-picker-modal-body">
            <div className="gender-radio-options">
              {GENDER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`gender-radio-pill ${
                    option.value === gender ? "is-active" : ""
                  }`}
                  data-bs-dismiss="modal"
                  onClick={() => onConfirm?.(option.value)}
                >
                  {option.label}
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
