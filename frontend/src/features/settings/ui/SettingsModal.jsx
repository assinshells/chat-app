import { useState } from "react";
import { createPortal } from "react-dom";
import { Moon, Sun } from "lucide-react";

import { GENDER_OPTIONS } from "@shared/constants/auth.constants.js";
import { applyTheme, getStoredTheme, THEMES } from "@shared/lib/theme.js";
import { useSettingsStore } from "@features/settings/model/useSettingsStore.js";

const TABS = [
  { id: "profile", label: "Профіль" },
  { id: "theme", label: "Тема" },
];

export function SettingsModal({ modalId = "settingsModal" }) {
  const [activeTab, setActiveTab] = useState("profile");

  const {
    gender: storedGender,
    loading,
    error,
    success,
    updateGender,
    clearStatus,
  } = useSettingsStore();

  const [gender, setGender] = useState(() => storedGender);
  const [theme, setThemeState] = useState(() => getStoredTheme());

  const handleGenderSubmit = (e) => {
    e.preventDefault();
    if (!gender || loading) return;
    updateGender(gender);
  };

  const handleThemeSelect = (next) => {
    setThemeState(next);
    applyTheme(next);
  };

  // Портал в document.body обязателен: Bootstrap-модалка использует
  // position: fixed относительно вьюпорта, а не своего DOM-родителя.
  // Если рендерить её как обычного React-child внутри .app-sidebar,
  // она попадёт в поддерево с transform/overflow:hidden (см. _sidebar.css)
  // — это создаёт новый containing block для fixed-элементов, и модалка
  // либо обрежется по ширине свёрнутого сайдбара, либо будет смещена
  // и отцентрована относительно него, а не относительно экрана.
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
              onClick={clearStatus}
            />
          </div>

          <div className="settings-tabs-nav">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`settings-tab-btn ${activeTab === tab.id ? "is-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="modal-body">
            {activeTab === "profile" && (
              <form onSubmit={handleGenderSubmit}>
                <label className="mb-2 text-muted small d-block">
                  Як ви себе ідентифікуєте?
                </label>

                <div className="d-flex align-items-center flex-wrap mb-3">
                  {GENDER_OPTIONS.map((option) => (
                    <div className="form-check me-3" key={option.value}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="settings-gender"
                        id={`settings-gender-${option.value}`}
                        value={option.value}
                        checked={gender === option.value}
                        onChange={(e) => setGender(e.target.value)}
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`settings-gender-${option.value}`}
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>

                {error && <p className="text-danger small mb-3">{error}</p>}
                {success && (
                  <p className="text-success small mb-3">Збережено</p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary rounded-4 fw-bold"
                  disabled={loading || !gender}
                >
                  {loading ? "Зберігаємо..." : "Зберегти"}
                </button>
              </form>
            )}

            {activeTab === "theme" && (
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
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}