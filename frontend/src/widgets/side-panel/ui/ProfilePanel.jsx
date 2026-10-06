import { useState } from "react";
import {
  Moon,
  Palette,
  ShieldCheck,
  UserPen,
  ChevronDown,
  ChevronRight,
  Settings,
  CircleHelp,
  TriangleAlert,
  ScrollText,
  Cookie,
  Code,
  MessageSquareText,
} from "lucide-react";

import {
  STATUS_OPTIONS,
  DEFAULT_STATUS,
  getStatusLabel,
} from "@shared/constants/status.constants.js";
import { StatusIcon } from "@shared/ui/status-icon";
import {
  RULES_MODAL_ID,
  FEEDBACK_MODAL_ID,
  WARNING_MODAL_ID,
  COOKIES_MODAL_ID,
  DEVELOPER_MODAL_ID,
} from "@shared/constants/infoModals.constants.js";
import { AppScrollbar } from "@shared/ui/scrollbar";
import { ProfileEditView } from "./ProfileEditView.jsx";
import { DarkModeView } from "./DarkModeView.jsx";
import { AppearanceView } from "./AppearanceView.jsx";
import { SecurityView } from "./SecurityView.jsx";

const SETTINGS_ITEMS = [
  { id: "profile", label: "Інформація профілю", icon: UserPen },
  { id: "dark-mode", label: "Темний режим", icon: Moon },
  { id: "appearance", label: "Зовнішній вигляд", icon: Palette },
  { id: "security", label: "Безпека", icon: ShieldCheck },
];

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

/**
 * ProfilePanel — "усе про мене" в одній панелі: статус, профіль,
 * налаштування (інформація профілю, темний режим), допомога (правила,
 * зворотний зв'язок), вихід — кнопка, закріплена внизу панелі.
 * Замінює колишні таби "Профіль" і "Налаштування" лівого сайдбара.
 */
export function ProfilePanel({
  currentUserStatus,
  onStatusChange,
  onColorChange,
  onTextStyleChange,
  logoutModalId,
}) {
  // Яка вкладена панель відкрита поверх профілю (null — жодна).
  const [subView, setSubView] = useState(null);
  const closeSubView = () => setSubView(null);

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
      <details className="app-panel-details">
        <summary className="app-panel-summary">
          <Settings size={18} />
          <span className="app-panel-summary-label">Налаштування</span>
          <ChevronDown size={16} className="app-panel-summary-chevron" />
        </summary>

        {SETTINGS_ITEMS.map(({ id, label, icon: ItemIcon }) => (
          <button
            key={id}
            type="button"
            className="app-sidebar-theme-btn"
            onClick={() => setSubView(id)}
          >
            <ItemIcon size={18} />
            <span>{label}</span>
            <ChevronRight size={16} className="ms-auto" />
          </button>
        ))}
      </details>

      <details className="app-panel-details">
        <summary className="app-panel-summary">
          <CircleHelp size={18} />
          <span className="app-panel-summary-label">Допомога</span>
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

    </AppScrollbar>

    {/* Кнопка виходу закріплена внизу панелі (поза прокруткою). */}
    <div className="app-panel-footer">
      <button
        type="button"
        className="btn btn-danger fw-bold w-100"
        data-bs-toggle="modal"
        data-bs-target={`#${logoutModalId}`}
      >
        Вийти
      </button>
    </div>

    {subView === "profile" && <ProfileEditView onBack={closeSubView} />}
    {subView === "dark-mode" && <DarkModeView onBack={closeSubView} />}
    {subView === "security" && <SecurityView onBack={closeSubView} />}
    {subView === "appearance" && (
      <AppearanceView
        onBack={closeSubView}
        onColorChange={onColorChange}
        onTextStyleChange={onTextStyleChange}
      />
    )}
    </>
  );
}
