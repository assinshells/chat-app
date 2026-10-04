import { useState } from "react";

import { SubPanelView } from "./SubPanelView.jsx";
import { applyTheme, getStoredTheme, THEMES } from "@shared/lib/theme.js";

const DARK_MODE_OPTIONS = [
  { id: THEMES.DARK, label: "Увімкнено" },
  { id: THEMES.LIGHT, label: "Вимкнено" },
  { id: THEMES.SYSTEM, label: "Використовувати системні налаштування" },
];

/**
 * DarkModeView — вкладена панель "Темний режим": накладається поверх
 * бокової панелі (SubPanelView), має кнопку "Назад" і радіокнопки
 * Увімкнено / Вимкнено / Системні налаштування. Вибір одразу
 * застосовується й зберігається (applyTheme).
 */
export function DarkModeView({ onBack }) {
  const [theme, setTheme] = useState(() => getStoredTheme());

  const handleSelect = (next) => {
    setTheme(next);
    applyTheme(next);
  };

  return (
    <SubPanelView title="Темний режим" onBack={onBack}>
      <div role="radiogroup">
        {DARK_MODE_OPTIONS.map(({ id, label }) => (
          <label key={id} className="app-radio-row">
            <input
              type="radio"
              name="dark-mode"
              className="form-check-input"
              checked={theme === id}
              onChange={() => handleSelect(id)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </SubPanelView>
  );
}
