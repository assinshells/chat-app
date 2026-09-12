import { useState } from "react";
import { createPortal } from "react-dom";
import { Moon, Monitor, SlidersHorizontal, Sun, User } from "lucide-react";

import { applyTheme, getStoredTheme, THEMES } from "@shared/lib/theme.js";
import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { getRoleLabel } from "@shared/constants/role.constants.js";

// Вкладки модалки налаштувань. "Загальні" — вибір теми (єдине, що
// лишилось редаговуваним тут, див. коментар нижче); "Акаунт" —
// довідкова інформація про поточного користувача (нік, роль).
const TABS = Object.freeze({
  GENERAL: "general",
  ACCOUNT: "account",
});

// Стать і колір нікнейма/повідомлень тепер обираються лише один раз —
// на формі реєстрації (RegisterForm.jsx) — і більше не редагуються з
// цієї модалки: у вкладці "Загальні" залишається тільки вибір теми.
export function SettingsModal({ modalId = "settingsModal" }) {
  const [theme, setThemeState] = useState(() => getStoredTheme());
  const [activeTab, setActiveTab] = useState(TABS.GENERAL);

  const login = useCurrentUserStore((state) => state.login);
  const role = useCurrentUserStore((state) => state.role);

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
      data-bs-backdrop="static"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content settings-modal">
          <div className="modal-header settings-modal-header">
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Закрити"
            />
          </div>

          <div className="modal-body settings-modal-body">
            {/* Вертикальні таби зліва: над ними — назва "Налаштування"
                (менша за розміром, ніж пункти табів), кнопка закриття
                лишилась у modal-header. */}
            <div className="settings-tabs-nav" role="tablist" aria-orientation="vertical">
              <span className="settings-tabs-title" id={`${modalId}Label`}>
                Налаштування
              </span>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === TABS.GENERAL}
                className={`settings-tab-btn ${activeTab === TABS.GENERAL ? "is-active" : ""}`}
                onClick={() => setActiveTab(TABS.GENERAL)}
              >
                <SlidersHorizontal size={16} />
                <span>Загальні</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === TABS.ACCOUNT}
                className={`settings-tab-btn ${activeTab === TABS.ACCOUNT ? "is-active" : ""}`}
                onClick={() => setActiveTab(TABS.ACCOUNT)}
              >
                <User size={16} />
                <span>Акаунт</span>
              </button>
            </div>

            <div className="settings-tab-content">
              {activeTab === TABS.GENERAL && (
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

                  <button
                    type="button"
                    className={`settings-theme-btn ${theme === THEMES.SYSTEM ? "is-active" : ""}`}
                    onClick={() => handleThemeSelect(THEMES.SYSTEM)}
                  >
                    <Monitor size={20} />
                    <span>Системна</span>
                  </button>
                </div>
              )}

              {activeTab === TABS.ACCOUNT && (
                <div className="settings-account-info">
                  <div className="settings-account-row">
                    <span className="settings-account-label">Нікнейм</span>
                    <span className="settings-account-value">{login ?? "—"}</span>
                  </div>

                  <div className="settings-account-row">
                    <span className="settings-account-label">Роль</span>
                    <span className="settings-account-value">
                      {role ? getRoleLabel(role) : "—"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}