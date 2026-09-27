import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getColorLabel,
  getEffectiveColorHex,
  getVisibleColorOptions,
} from "@shared/constants/color.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";

// Приклад фрази, якою прямо в модалці показується, як виглядатиме нік/
// повідомлення обраним кольором — без цього самі кружки-свотчі й назва
// кольору не дають уявлення про читабельність кольору на реальному тексті.
const PREVIEW_TEXT = "Ось так виглядатиме ваш текст у чаті";

/**
 * ColorPickerModal — вибір кольору нікнейма/повідомлень винесено сюди з
 * форми реєстрації (RegisterForm.jsx), у окрему модалку: без шапки й
 * футера (той самий "безшапковий" патерн, що й RoomSelectModal/
 * DeveloperModal — .modal-header лишається технічно заради
 * data-bs-dismiss на хрестику, але візуально порожній), лишається лише
 * хрестик закриття та кнопка "Прийняти" прямо в тілі.
 *
 * На відміну від RoomSelectModal (де клік по кімнаті одразу застосовує
 * вибір і закриває модалку), тут вибір застосовується лише по кнопці
 * "Прийняти" — доти працює локальна чернетка (draftColor), яка при
 * кожному відкритті модалки скидається до поточного підтвердженого
 * кольору (color-пропс). Закриття хрестиком/бекдропом без "Прийняти"
 * нічого не змінює в стані форми реєстрації.
 */
export function ColorPickerModal({ modalId = "colorPickerModal", color, onConfirm }) {
  const isDarkTheme = useIsDarkTheme();
  const visibleColorOptions = getVisibleColorOptions(isDarkTheme);

  const [draftColor, setDraftColor] = useState(color);
  const modalRef = useRef(null);

  useEffect(() => {
    const el = modalRef.current;
    if (!el) return undefined;

    const handleShow = () => setDraftColor(color);
    el.addEventListener("show.bs.modal", handleShow);
    return () => el.removeEventListener("show.bs.modal", handleShow);
  }, [color]);

  // Той самий запобіжник, що й у RegisterForm: якщо тема змінюється,
  // поки модалка відкрита, і чернетка вказує на колір, прихований на
  // новій темі ("чорний" на темній / "білий" на світлій), підміняється
  // поточним підтвердженим кольором форми, а не залишається "невидимим"
  // пунктом палітри.
  const effectiveDraftColor = visibleColorOptions.some(
    (option) => option.value === draftColor,
  )
    ? draftColor
    : color;

  return createPortal(
    <div
      ref={modalRef}
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

          <div className="modal-body color-picker-modal-body">
            <div className="color-radio-options">
              {visibleColorOptions.map((option) => (
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
                    name="colorPickerModalOption"
                    value={option.value}
                    checked={effectiveDraftColor === option.value}
                    onChange={(e) => setDraftColor(e.target.value)}
                    aria-label={option.label}
                  />
                </label>
              ))}
            </div>

            <p
              className="color-radio-selected-name mb-2"
              style={{
                color: getEffectiveColorHex(effectiveDraftColor, isDarkTheme),
              }}
            >
              {getColorLabel(effectiveDraftColor)}
            </p>

            <p
              className="color-picker-preview-text mb-3"
              style={{
                color: getEffectiveColorHex(effectiveDraftColor, isDarkTheme),
              }}
            >
              {PREVIEW_TEXT}
            </p>

            <button
              type="button"
              className="btn btn-primary fw-bold w-100"
              data-bs-dismiss="modal"
              onClick={() => onConfirm?.(effectiveDraftColor)}
            >
              Прийняти
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
