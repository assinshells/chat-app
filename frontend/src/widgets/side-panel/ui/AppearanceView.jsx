import { useState } from "react";
import { Bold, ChevronDown, Italic, Palette } from "lucide-react";

import {
  DEFAULT_COLOR,
  getColorLabel,
  getEffectiveColorHex,
  getVisibleColorOptions,
} from "@shared/constants/color.constants.js";
import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";

import { SubPanelView } from "./SubPanelView.jsx";

// Приклад фрази, якою показується, як виглядатиме нік/повідомлення
// обраним кольором (самі кружки й назва не дають уявлення про
// читабельність кольору на реальному тексті).
const PREVIEW_TEXT = "Ось так виглядатиме ваш текст у чаті";

/**
 * AppearanceView — вкладена панель "Зовнішній вигляд" (Налаштування →
 * Зовнішній вигляд):
 *  - "Змінити колір тексту" — розкривне меню (<details>) з палітрою
 *    кольорів усередині; сам заголовок відображається обраним кольором,
 *    вибір застосовується одразу (як і перемикачі нижче);
 *  - "Курсив" і "Жирний текст" — перемикачі (form-switch).
 * Усе зберігається в БД і видно всім у чаті. Обробники повертають
 * { applied } — applied=false означає, що живе з'єднання не
 * оновилось і зміни підхопляться лише після повторного входу.
 */
export function AppearanceView({ onBack, onColorChange, onTextStyleChange }) {
  const isDarkTheme = useIsDarkTheme();

  const color = useCurrentUserStore((state) => state.color) ?? DEFAULT_COLOR;
  const bold = useCurrentUserStore((state) => state.bold);
  const italic = useCurrentUserStore((state) => state.italic);
  const visibleColorOptions = getVisibleColorOptions(isDarkTheme);

  // draftColor — щойно обраний, але ще не підтверджений сервером колір
  // (щоб кружок не "відскакував" до відповіді); null — показуємо колір зі
  // стору. Скидається, якщо зберегти не вдалося.
  const [draftColor, setDraftColor] = useState(null);
  const selectedColor = draftColor ?? color;
  const colorHex = getEffectiveColorHex(selectedColor, isDarkTheme);

  // null | "relogin" | "error"
  const [notice, setNotice] = useState(null);

  const run = (action, onFail) => {
    setNotice(null);
    Promise.resolve(action?.())
      .then((result) => {
        if (result && result.applied === false) setNotice("relogin");
      })
      .catch(() => {
        setNotice("error");
        onFail?.();
      });
  };

  const handleColorSelect = (next) => {
    setDraftColor(next);
    run(
      () => onColorChange?.(next),
      () => setDraftColor(null),
    );
  };

  return (
    <>
      <SubPanelView title="Зовнішній вигляд" onBack={onBack}>
        {notice === "relogin" && (
          <div className="alert alert-warning m-3 mb-0" role="alert">
            Зміни збережено, але щоб вони застосувалися до нових
            повідомлень, потрібно вийти та зайти знову.
          </div>
        )}
        {notice === "error" && (
          <div className="alert alert-danger m-3 mb-0" role="alert">
            Не вдалося зберегти зміни. Спробуйте ще раз.
          </div>
        )}

        <details className="app-panel-details">
          <summary className="app-panel-summary">
            <Palette size={18} style={{ color: colorHex }} />
            <span
              className="app-panel-summary-label"
              style={{
                color: colorHex,
                fontWeight: bold ? 700 : undefined,
                fontStyle: italic ? "italic" : undefined,
              }}
            >
              Змінити колір тексту
              <span className="app-appearance-color-name">
                {" "}
                · {getColorLabel(selectedColor)}
              </span>
            </span>
            <ChevronDown size={16} className="app-panel-summary-chevron" />
          </summary>

          <div className="app-appearance-color-body">
            <div
              className="color-radio-options"
              role="radiogroup"
              aria-label="Колір тексту"
            >
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
                  {/* input — ПЕРЕД кружком: кільце вибору в CSS задано як
                      .color-radio-input:checked ~ .color-radio-swatch. */}
                  <input
                    className="color-radio-input"
                    type="radio"
                    name="appearanceColorOption"
                    value={option.value}
                    checked={selectedColor === option.value}
                    onChange={() => handleColorSelect(option.value)}
                    aria-label={option.label}
                  />
                  <span className="color-radio-swatch" aria-hidden="true" />
                </label>
              ))}
            </div>

            <p
              className="color-picker-preview-text mb-0"
              style={{
                color: colorHex,
                fontWeight: bold ? 700 : undefined,
                fontStyle: italic ? "italic" : undefined,
              }}
            >
              {PREVIEW_TEXT}
            </p>
          </div>
        </details>

        <label className="app-switch-row">
          <Italic size={18} />
          <span>Курсив</span>
          <span className="form-check form-switch ms-auto mb-0">
            <input
              type="checkbox"
              role="switch"
              className="form-check-input"
              checked={italic}
              onChange={(e) =>
                run(() => onTextStyleChange?.({ italic: e.target.checked }))
              }
            />
          </span>
        </label>

        <label className="app-switch-row">
          <Bold size={18} />
          <span>Жирний текст</span>
          <span className="form-check form-switch ms-auto mb-0">
            <input
              type="checkbox"
              role="switch"
              className="form-check-input"
              checked={bold}
              onChange={(e) =>
                run(() => onTextStyleChange?.({ bold: e.target.checked }))
              }
            />
          </span>
        </label>
      </SubPanelView>
    </>
  );
}
