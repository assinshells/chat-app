import { useState } from "react";
import { createPortal } from "react-dom";
import { Moon, Sun } from "lucide-react";

import { applyTheme, getStoredTheme, THEMES } from "@shared/lib/theme.js";

// Стать і колір нікнейма/повідомлень тепер обираються лише один раз —
// на формі реєстрації (RegisterForm.jsx) — і більше не редагуються з
// цієї модалки: тут залишається тільки вибір теми.
export function SettingsModal({ modalId = "settingsModal" }) {
  const [theme, setThemeState] = useState(() => getStoredTheme());

  const handleThemeSelect = (next) => {
    setThemeState(next);
    applyTheme(next);
  };

  // Портал у document.body обов'язковий: Bootstrap-модалка використовує
  // position: fixed відносно вьюпорта, а не свого DOM-батька.
  // Якщо рендерити її як звичайного React-child всередині .app-sidebar,
  // вона потрапить у піддерево з transform/overflow:hidden (див. _sidebar.css)
  // — це створює новий containing block для fixed-елементів, і модалка
  // або обріжеться по ширині згорнутого сайдбара, або буде зміщена
  // і відцентрована відносно нього, а не відносно екрана.
  return createPortal(
    <div
      className="modal fade"
      id={modalId}
      tabIndex="-1"
      aria-labelledby={`${modalId}Label`}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content settings-modal">
          <div className="modal-header">
            <h5 className="modal-title" id={`${modalId}Label`}>
              Налаштування
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Закрити"
            />
          </div>

          <div className="modal-body">
            <div className="settings-theme-options">
              <button
                type="button"
                className={`settings-theme-btn ${theme === THEMES.LIGHT ? "is-active" : ""}`}
                onClick={() => handleThemeSelect(THEMES.LIGHT)}
              >
                <Sun size={20} />
                <span>Світла</span>
              </button>

              <button
                type="button"
                className={`settings-theme-btn ${theme === THEMES.DARK ? "is-active" : ""}`}
                onClick={() => handleThemeSelect(THEMES.DARK)}
              >
                <Moon size={20} />
                <span>Темна</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}