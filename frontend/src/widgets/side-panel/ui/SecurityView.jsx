import { useState } from "react";
import { ChevronRight, KeyRound, Mail } from "lucide-react";

import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";

import { SubPanelView } from "./SubPanelView.jsx";
import { EmailView } from "./EmailView.jsx";
import { ChangePasswordView } from "./ChangePasswordView.jsx";

/**
 * SecurityView — вкладена панель "Безпека" (Налаштування → Безпека).
 * Містить пункт "Додати ел. адресу" (раніше був у "Інформація профілю →
 * Контактна інформація"); якщо адресу вже вказано, пункт показує її.
 * Клік відкриває EmailView — вкладку зміни ел. адреси.
 * "Змінити пароль" відкриває ChangePasswordView (форма → код з листа);
 * без ел. адреси там показується підказка її додати.
 */
export function SecurityView({ onBack }) {
  const [subView, setSubView] = useState(null);
  const closeSubView = () => setSubView(null);

  const email = useCurrentUserStore((state) => state.email);
  const [passwordChanged, setPasswordChanged] = useState(false);

  return (
    <>
      <SubPanelView title="Безпека" onBack={onBack}>
        {passwordChanged && (
          <div className="alert alert-success m-3 mb-0" role="alert">
            Пароль успішно змінено.
          </div>
        )}

        <button
          type="button"
          className="app-sidebar-theme-btn"
          onClick={() => setSubView("email")}
        >
          <Mail size={18} />
          <span className="app-panel-summary-label">
            {email?.trim() || "Додати ел. адресу"}
          </span>
          <ChevronRight size={16} className="ms-auto" />
        </button>

        <button
          type="button"
          className="app-sidebar-theme-btn"
          onClick={() => {
            setPasswordChanged(false);
            setSubView("password");
          }}
        >
          <KeyRound size={18} />
          <span className="app-panel-summary-label">Змінити пароль</span>
          <ChevronRight size={16} className="ms-auto" />
        </button>
      </SubPanelView>

      {subView === "email" && <EmailView onBack={closeSubView} />}
      {subView === "password" && (
        <ChangePasswordView
          onBack={closeSubView}
          onAddEmail={() => setSubView("email")}
          onDone={() => {
            setPasswordChanged(true);
            closeSubView();
          }}
        />
      )}
    </>
  );
}
