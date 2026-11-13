import { useState } from "react";
import { ChevronRight, Moon, Palette, Settings, ShieldCheck, UserPen } from "lucide-react";

import { useAppModalStore } from "@shared/lib/appModalStore.js";
import { AppScrollbar } from "@shared/ui/scrollbar";
import { SplitModal } from "@shared/ui/split-modal";
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
 * SettingsModal — модалка "Налаштування" (іконка в шапці): ліворуч
 * розділи (інформація профілю, темний режим, зовнішній вигляд, безпека),
 * праворуч — вибраний розділ; на телефоні — список, а після вибору
 * розділ із кнопкою "Назад". Самі розділи — ті ж вкладені панелі
 * (SubPanelView), що й раніше; їх верхня шапка ховається, бо назву й
 * "Назад" показує шапка модалки (див. _split-modal.css).
 */
export function SettingsModal({ onColorChange, onTextStyleChange }) {
  const open = useAppModalStore((state) => state.settingsOpen);
  const close = useAppModalStore((state) => state.closeSettings);

  const [selected, setSelected] = useState(null);

  const handleClose = () => {
    setSelected(null);
    close();
  };
  const handleBack = () => setSelected(null);

  const current = SETTINGS_ITEMS.find((item) => item.id === selected);

  const list = (
    <AppScrollbar className="split-modal-nav">
      {SETTINGS_ITEMS.map(({ id, label, icon: ItemIcon }) => (
        <button
          key={id}
          type="button"
          className={`app-sidebar-theme-btn${id === selected ? " is-active" : ""}`}
          aria-current={id === selected ? "true" : undefined}
          onClick={() => setSelected(id)}
        >
          <ItemIcon size={18} />
          <span>{label}</span>
          <ChevronRight size={16} className="ms-auto" />
        </button>
      ))}
    </AppScrollbar>
  );

  return (
    <SplitModal
      open={open}
      onClose={handleClose}
      listTitle="Налаштування"
      list={list}
      hasDetail={Boolean(current)}
      onBack={handleBack}
      detailTitle={current?.label}
      placeholder={
        <>
          <Settings size={36} />
          <p className="mb-0">Оберіть розділ налаштувань</p>
        </>
      }
    >
      {/* key: інший розділ — чистий стан вкладених панелей. */}
      {selected === "profile" && <ProfileEditView key={selected} onBack={handleBack} />}
      {selected === "dark-mode" && <DarkModeView key={selected} onBack={handleBack} />}
      {selected === "security" && <SecurityView key={selected} onBack={handleBack} />}
      {selected === "appearance" && (
        <AppearanceView
          key={selected}
          onBack={handleBack}
          onColorChange={onColorChange}
          onTextStyleChange={onTextStyleChange}
        />
      )}
    </SplitModal>
  );
}
