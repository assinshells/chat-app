import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { getColorLabel, getEffectiveColorHex } from "@shared/constants/color.constants.js";

/**
 * ColorPickerModal — Bootstrap-модалка вибору кольору нікнейма/повідомлень
 * для форми реєстрації (RegisterForm.jsx). На відміну від інших модалок
 * застосунку (LogoutConfirmModal.jsx, KickModal.jsx) свідомо БЕЗ
 * modal-header, modal-footer і кнопки-хрестика закриття — лише сама
 * палітра, підпис обраного кольору і дві кнопки в тілі модалки.
 *
 * Вибір усередині модалки — "чернетка" (draftColor), окрема від
 * реального значення кольору форми: він застосовується нагору лише по
 * "Прийняти" (onApply), а по "Скасувати" — просто відкидається. Тому
 * draftColor скидається на currentColor не один раз при монтуванні, а
 * при КОЖНОМУ відкритті модалки (подія show.bs.modal) — інакше повторне
 * відкриття після "Скасувати" показувало б відхилений вибір, а не
 * дійсний збережений колір.
 */
export function ColorPickerModal({
  modalId = "registerColorModal",
  colorOptions,
  currentColor,
  isDarkTheme,
  onApply,
}) {
  const modalRef = useRef(null);
  const [draftColor, setDraftColor] = useState(currentColor);

  useEffect(() => {
    const node = modalRef.current;
    if (!node) return undefined;

    const handleShow = () => setDraftColor(currentColor);
    node.addEventListener("show.bs.modal", handleShow);
    return () => node.removeEventListener("show.bs.modal", handleShow);
  }, [currentColor]);

  return createPortal(
    <div
      className="modal fade"
      id={modalId}
      tabIndex="-1"
      aria-hidden="true"
      aria-label="Вибір кольору"
      data-bs-backdrop="static"
      ref={modalRef}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content app-modal">
          <div className="modal-body color-picker-modal-body">
            <div className="color-radio-options">
              {colorOptions.map((option) => (
                <label
                  key={option.value}
                  className="color-radio-option"
                  style={{
                    "--swatch-color": option.hex,
                    "--swatch-color-dark": option.hexDark ?? option.hex,
                  }}
                  title={option.label}
                >
                  <span className="color-radio-swatch" aria-hidden="true" />
                  <input
                    className="color-radio-input"
                    type="radio"
                    name="colorDraft"
                    value={option.value}
                    checked={draftColor === option.value}
                    onChange={(e) => setDraftColor(e.target.value)}
                    aria-label={option.label}
                  />
                </label>
              ))}
            </div>

            {/* Замість статичної назви кольору — текст, пофарбований у
                щойно обраний (ще не застосований) колір, щоб було одразу
                видно результат до підтвердження. */}
            <p
              className="color-radio-selected-name mb-4"
              style={{ color: getEffectiveColorHex(draftColor, isDarkTheme) }}
            >
              {getColorLabel(draftColor)}
            </p>

            <div className="d-flex gap-2">
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
                onClick={() => onApply(draftColor)}
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