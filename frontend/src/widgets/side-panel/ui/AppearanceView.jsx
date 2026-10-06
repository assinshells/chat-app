import { useState } from "react";
import { Bold, ChevronRight, Italic, Palette } from "lucide-react";

import { ColorPickerModal } from "@features/auth/register/ui/ColorPickerModal.jsx";
import {
  DEFAULT_COLOR,
  getColorLabel,
  getEffectiveColorHex,
} from "@shared/constants/color.constants.js";
import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";

import { SubPanelView } from "./SubPanelView.jsx";

const COLOR_MODAL_ID = "appearanceColorModal";

/**
 * AppearanceView — вкладена панель "Зовнішній вигляд" (Налаштування →
 * Зовнішній вигляд):
 *  - "Змінити колір тексту" — тригер модалки ColorPickerModal; сам
 *    пункт відображається обраним кольором;
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
  const colorHex = getEffectiveColorHex(color, isDarkTheme);

  // null | "relogin" | "error"
  const [notice, setNotice] = useState(null);

  const run = (action) => {
    setNotice(null);
    Promise.resolve(action?.())
      .then((result) => {
        if (result && result.applied === false) setNotice("relogin");
      })
      .catch(() => setNotice("error"));
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

        <button
          type="button"
          className="app-sidebar-theme-btn"
          data-bs-toggle="modal"
          data-bs-target={`#${COLOR_MODAL_ID}`}
        >
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
              · {getColorLabel(color)}
            </span>
          </span>
          <ChevronRight size={16} className="ms-auto" />
        </button>

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

      <ColorPickerModal
        modalId={COLOR_MODAL_ID}
        color={color}
        onConfirm={(next) => run(() => onColorChange?.(next))}
      />
    </>
  );
}
