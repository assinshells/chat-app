import { useState } from "react";
import { ChevronRight, Moon, Palette, ShieldCheck, UserPen } from "lucide-react";

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

/**
 * SettingsPanel — вкладка "Налаштування": інформація профілю, темний
 * режим, зовнішній вигляд, безпека. Кожен пункт відкриває вкладену
 * панель поверх сайдбара (.app-panel-overlay).
 */
export function SettingsPanel({ onColorChange, onTextStyleChange }) {
  const [subView, setSubView] = useState(null);
  const closeSubView = () => setSubView(null);

  return (
    <>
      <AppScrollbar className="app-panel-scroll">
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
      </AppScrollbar>

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
