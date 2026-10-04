import { useState } from "react";
import {
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  Info,
  TriangleAlert,
  ScrollText,
  Cookie,
  Code,
  MessageSquareText,
} from "lucide-react";

import { FriendsList } from "@features/friends";
import { BlockedUsersList } from "@features/block";
import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import {
  updateEmail,
  updateCity,
  updateDisplayName,
  updateAbout,
} from "@shared/api/profile.api.js";
import {
  STATUS_OPTIONS,
  DEFAULT_STATUS,
  getStatusLabel,
} from "@shared/constants/status.constants.js";
import { StatusIcon } from "@shared/ui/status-icon";
import { EditableProfileField } from "./EditableProfileField.jsx";
import {
  RULES_MODAL_ID,
  FEEDBACK_MODAL_ID,
  WARNING_MODAL_ID,
  COOKIES_MODAL_ID,
  DEVELOPER_MODAL_ID,
} from "@shared/constants/infoModals.constants.js";
import { AppScrollbar } from "@shared/ui/scrollbar";
import { applyTheme, getStoredTheme, THEMES } from "@shared/lib/theme.js";

const INFO_LINKS = [
  { label: "Попередження", icon: TriangleAlert, modalId: WARNING_MODAL_ID },
  { label: "Правила", icon: ScrollText, modalId: RULES_MODAL_ID },
  { label: "Файли cookie", icon: Cookie, modalId: COOKIES_MODAL_ID },
  { label: "Розробники", icon: Code, modalId: DEVELOPER_MODAL_ID },
  {
    label: "Зворотний зв'язок",
    icon: MessageSquareText,
    modalId: FEEDBACK_MODAL_ID,
  },
];

const THEME_OPTIONS = [
  { id: THEMES.LIGHT, label: "Світла", icon: Sun },
  { id: THEMES.DARK, label: "Темна", icon: Moon },
  { id: THEMES.SYSTEM, label: "Системна", icon: Monitor },
];

/**
 * ProfilePanel — "усе про мене" в одній панелі: статус, профіль,
 * тема, друзі, заблоковані, інформація (правила, зворотний зв'язок), вихід — кнопка в кінці панелі.
 * Замінює колишні таби "Профіль" і "Налаштування" лівого сайдбара.
 */
export function ProfilePanel({
  login,
  currentUserStatus,
  onStatusChange,
  logoutModalId,
}) {
  const [theme, setTheme] = useState(() => getStoredTheme());

  const email = useCurrentUserStore((state) => state.email);
  const city = useCurrentUserStore((state) => state.city);
  const displayName = useCurrentUserStore((state) => state.displayName);
  const about = useCurrentUserStore((state) => state.about);
  const setEmail = useCurrentUserStore((state) => state.setEmail);
  const setCity = useCurrentUserStore((state) => state.setCity);
  const setDisplayName = useCurrentUserStore((state) => state.setDisplayName);
  const setAbout = useCurrentUserStore((state) => state.setAbout);

  const handleThemeSelect = (next) => {
    setTheme(next);
    applyTheme(next);
  };

  // Кожен onSave стосується лише свого поля (див. EditableProfileField).
  const handleSaveEmail = async (next) => setEmail((await updateEmail(next)).email);
  const handleSaveCity = async (next) => setCity((await updateCity(next)).city);
  const handleSaveDisplayName = async (next) =>
    setDisplayName((await updateDisplayName(next)).displayName);
  const handleSaveAbout = async (next) => setAbout((await updateAbout(next)).about);

  return (
    <>
      <div className="app-profile-head">
        <div className="dropdown">
          <button
            type="button"
            className="app-profile-status-btn dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <StatusIcon status={currentUserStatus} size={12} />
            {getStatusLabel(currentUserStatus)}
            <ChevronDown size={14} className="ms-1" />
          </button>

          <div className="dropdown-menu">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <a
                key={value}
                className={`dropdown-item ${
                  (currentUserStatus ?? DEFAULT_STATUS) === value ? "is-active" : ""
                }`}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onStatusChange?.(value);
                }}
              >
                <StatusIcon status={value} size={12} /> {label}
              </a>
            ))}
          </div>
        </div>
      </div>

    <AppScrollbar className="app-panel-scroll">
      <section className="app-panel-section">
        <h6 className="app-sidebar-settings-group-label">Про себе</h6>
        <EditableProfileField
          label="Про себе"
          value={about}
          placeholder="Розкажіть трохи про себе"
          maxLength={500}
          multiline
          rows={4}
          onSave={handleSaveAbout}
        />
      </section>

      <section className="app-panel-section">
        <h6 className="app-sidebar-settings-group-label">Особиста інформація</h6>

        <div className="mb-2">
          <p className="text-muted mb-1">Login</p>
          <h5 className="font-size-14">{login}</h5>
        </div>

        <EditableProfileField
          label="Name"
          value={displayName}
          placeholder="Наприклад, Erik Thompson"
          maxLength={120}
          onSave={handleSaveDisplayName}
        />
        <EditableProfileField
          label="Email"
          value={email}
          type="email"
          placeholder="Email не вказано"
          onSave={handleSaveEmail}
        />
        <EditableProfileField
          label="Location"
          value={city}
          placeholder="Місто не вказано"
          maxLength={120}
          onSave={handleSaveCity}
        />
      </section>

      <section className="app-panel-section app-panel-section-flush">
        <h6 className="app-sidebar-settings-group-label px-3">Тема</h6>
        {THEME_OPTIONS.map(({ id, label, icon: ThemeIcon }) => (
          <button
            key={id}
            type="button"
            className={`app-sidebar-theme-btn ${theme === id ? "is-active" : ""}`}
            onClick={() => handleThemeSelect(id)}
          >
            <ThemeIcon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </section>

      <details className="app-panel-details">
        <summary>Друзі</summary>
        <FriendsList />
      </details>

      <details className="app-panel-details">
        <summary>Заблоковані</summary>
        <BlockedUsersList />
      </details>

      <details className="app-panel-details">
        <summary className="app-panel-summary">
          <Info size={18} />
          <span className="app-panel-summary-label">Інформація</span>
          <ChevronDown size={16} className="app-panel-summary-chevron" />
        </summary>

        {INFO_LINKS.map(({ label, icon: LinkIcon, modalId }) => (
          <button
            key={modalId}
            type="button"
            className="app-sidebar-theme-btn"
            data-bs-toggle="modal"
            data-bs-target={`#${modalId}`}
          >
            <LinkIcon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </details>

      <div className="p-3">
        <button
          type="button"
          className="btn btn-outline-danger w-100"
          data-bs-toggle="modal"
          data-bs-target={`#${logoutModalId}`}
        >
          Вийти
        </button>
      </div>
    </AppScrollbar>
    </>
  );
}
