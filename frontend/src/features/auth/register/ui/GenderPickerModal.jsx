import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * GenderPickerModal — Bootstrap-модалка вибору статі для форми
 * реєстрації (RegisterForm.jsx), той самий патерн, що й
 * ColorPickerModal.jsx: без modal-header/modal-footer, лише список
 * варіантів і дві кнопки в тілі модалки.
 *
 * Вибір усередині модалки — "чернетка" (draftGender), окрема від
 * реального значення статі форми: застосовується нагору лише по
 * "Прийняти" (onApply), по "Скасувати" — відкидається. draftGender
 * скидається на currentGender при КОЖНОМУ відкритті модалки (подія
 * show.bs.modal), а не лише при монтуванні — інакше повторне відкриття
 * після "Скасувати" показувало б відхилений вибір, а не дійсний.
 */
export function GenderPickerModal({
  modalId = "registerGenderModal",
  genderOptions,
  currentGender,
  onApply,
}) {
  const modalRef = useRef(null);
  const [draftGender, setDraftGender] = useState(currentGender);

  useEffect(() => {
    const node = modalRef.current;
    if (!node) return undefined;

    const handleShow = () => setDraftGender(currentGender);
    node.addEventListener("show.bs.modal", handleShow);
    return () => node.removeEventListener("show.bs.modal", handleShow);
  }, [currentGender]);

  return createPortal(
    <div
      className="modal fade"
      id={modalId}
      tabIndex="-1"
      aria-hidden="true"
      aria-label="Вибір статі"
      data-bs-backdrop="static"
      ref={modalRef}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content app-modal">
          <div className="modal-body gender-picker-modal-body">
            <div className="gender-radio-options">
              {genderOptions.map((option) => (
                <label key={option.value} className="gender-radio-option">
                  <input
                    className="gender-radio-input"
                    type="radio"
                    name="genderDraft"
                    value={option.value}
                    checked={draftGender === option.value}
                    onChange={(e) => setDraftGender(e.target.value)}
                  />
                  <span className="gender-radio-pill">{option.label}</span>
                </label>
              ))}
            </div>

            <div className="d-flex gap-2 mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-4 fw-bold flex-fill"
                data-bs-dismiss="modal"
              >
                Скасувати
              </button>
              <button
                type="button"
                className="btn btn-primary rounded-4 fw-bold flex-fill"
                data-bs-dismiss="modal"
                onClick={() => onApply(draftGender)}
              >
                Прийняти
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
