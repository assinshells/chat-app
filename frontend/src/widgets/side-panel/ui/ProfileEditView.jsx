import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  NotebookPen,
  UserRound,
  MapPin,
  Heart,
  Pencil,
} from "lucide-react";

import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";

import { SubPanelView } from "./SubPanelView.jsx";
import { AboutView } from "./AboutView.jsx";
import { CityView } from "./CityView.jsx";
import { NameView } from "./NameView.jsx";
import { MaritalStatusView } from "./MaritalStatusView.jsx";
import { getMaritalStatusLabel } from "@shared/constants/maritalStatus.constants.js";

/**
 * ProfileEditView — вкладена панель "Редагування профілю" (відкривається з
 * Налаштувань → "Інформація профілю"). Містить розкривний список "Про себе"
 * з пунктами "Про себе" (AboutView) та "Ваше ім'я" (NameView) і розкривний список "Особиста інформація"
 * з пунктами "Місто" (CityView) та "Сімейний стан" (MaritalStatusView);
 * і розкривний список "Контактна інформація" з пунктом "Додати ел. адресу"
 * (ел. адреса перенесена в Налаштування → Безпека, див. SecurityView).
 */
export function ProfileEditView({ onBack }) {
  // Яка вкладена панель відкрита поверх (null — жодна).
  const [subView, setSubView] = useState(null);
  const closeSubView = () => setSubView(null);

  const city = useCurrentUserStore((state) => state.city);
  const displayName = useCurrentUserStore((state) => state.displayName);
  const maritalStatus = useCurrentUserStore((state) => state.maritalStatus);

  return (
    <>
      <SubPanelView title="Редагування профілю" onBack={onBack}>
        <details className="app-panel-details" open>
          <summary className="app-panel-summary">
            <FileText size={18} />
            <span className="app-panel-summary-label">Про себе</span>
            <ChevronDown size={16} className="app-panel-summary-chevron" />
          </summary>

          <button
            type="button"
            className="app-sidebar-theme-btn"
            onClick={() => setSubView("about")}
          >
            <NotebookPen size={18} />
            <span>Про себе</span>
            <ChevronRight size={16} className="ms-auto" />
          </button>

          <button
            type="button"
            className="app-sidebar-theme-btn"
            onClick={() => setSubView("name")}
          >
            <Pencil size={18} />
            <span className="app-panel-summary-label">
              {displayName?.trim() || "Ваше ім'я"}
            </span>
            <ChevronRight size={16} className="ms-auto" />
          </button>
        </details>

        <details className="app-panel-details" open>
          <summary className="app-panel-summary">
            <UserRound size={18} />
            <span className="app-panel-summary-label">Особиста інформація</span>
            <ChevronDown size={16} className="app-panel-summary-chevron" />
          </summary>

          <button
            type="button"
            className="app-sidebar-theme-btn"
            onClick={() => setSubView("city")}
          >
            <MapPin size={18} />
            <span className="app-panel-summary-label">
              {city?.trim() || "Місто"}
            </span>
            <ChevronRight size={16} className="ms-auto" />
          </button>

          <button
            type="button"
            className="app-sidebar-theme-btn"
            onClick={() => setSubView("marital")}
          >
            <Heart size={18} />
            <span className="app-panel-summary-label">
              {getMaritalStatusLabel(maritalStatus) || "Сімейний стан"}
            </span>
            <ChevronRight size={16} className="ms-auto" />
          </button>
        </details>

      </SubPanelView>

      {subView === "about" && <AboutView onBack={closeSubView} />}
      {subView === "city" && <CityView onBack={closeSubView} />}
      {subView === "name" && <NameView onBack={closeSubView} />}
      {subView === "marital" && <MaritalStatusView onBack={closeSubView} />}
    </>
  );
}
