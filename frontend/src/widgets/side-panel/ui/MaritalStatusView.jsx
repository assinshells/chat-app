import { useState } from "react";

import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { updateMaritalStatus } from "@shared/api/profile.api.js";
import { MARITAL_STATUS_OPTIONS } from "@shared/constants/maritalStatus.constants.js";
import { SubPanelView } from "./SubPanelView.jsx";

/**
 * MaritalStatusView — вкладена панель "Сімейний стан": випадаючий список
 * (плейсхолдер "Статус") і кнопка "Зберегти" внизу (активна, коли вибір
 * змінився; вибір плейсхолдера очищає значення).
 */
export function MaritalStatusView({ onBack }) {
  const maritalStatus = useCurrentUserStore((state) => state.maritalStatus);
  const setMaritalStatus = useCurrentUserStore(
    (state) => state.setMaritalStatus,
  );

  const saved = maritalStatus ?? "";
  const [value, setValue] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isChanged = value !== saved;

  const handleSave = async () => {
    if (!isChanged || saving) return;
    setSaving(true);
    setError("");
    try {
      const result = await updateMaritalStatus(value);
      setMaritalStatus(result.maritalStatus);
      onBack();
    } catch {
      setError("Не вдалося зберегти. Спробуйте ще раз.");
      setSaving(false);
    }
  };

  return (
    <SubPanelView
      title="Сімейний стан"
      onBack={onBack}
      footer={
        <button
          type="button"
          className="btn btn-primary fw-bold w-100"
          disabled={!isChanged || saving}
          onClick={handleSave}
        >
          {saving ? "Зберігаємо..." : "Зберегти"}
        </button>
      }
    >
      <div className="p-3">
        <select
          className="form-select"
          aria-label="Сімейний стан"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="">Статус</option>
          {MARITAL_STATUS_OPTIONS.map(({ value: optionValue, label }) => (
            <option key={optionValue} value={optionValue}>
              {label}
            </option>
          ))}
        </select>

        {error && <div className="text-danger small mt-2">{error}</div>}
      </div>
    </SubPanelView>
  );
}
