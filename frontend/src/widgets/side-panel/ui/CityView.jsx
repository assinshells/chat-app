import { useState } from "react";

import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { updateCity } from "@shared/api/profile.api.js";
import { SubPanelView } from "./SubPanelView.jsx";

const MAX_CITY_LENGTH = 120;

/**
 * CityView — вкладена панель "Місто": поле вводу і кнопка "Зберегти" внизу
 * (активна, коли значення змінилось; порожнє значення очищає місто).
 */
export function CityView({ onBack }) {
  const city = useCurrentUserStore((state) => state.city);
  const setCity = useCurrentUserStore((state) => state.setCity);

  const savedCity = (city ?? "").trim();
  const [text, setText] = useState(() => city ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isChanged = text.trim() !== savedCity;

  const handleSave = async () => {
    if (!isChanged || saving) return;
    setSaving(true);
    setError("");
    try {
      const result = await updateCity(text.trim());
      setCity(result.city);
      onBack();
    } catch {
      setError("Не вдалося зберегти. Спробуйте ще раз.");
      setSaving(false);
    }
  };

  return (
    <SubPanelView
      title="Місто"
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
        <label htmlFor="city-input" className="mb-2 text-muted small d-block">
          Ваше місто
        </label>

        <input
          id="city-input"
          type="text"
          className="form-control"
          maxLength={MAX_CITY_LENGTH}
          placeholder="Наприклад, Київ"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {error && <div className="text-danger small mt-2">{error}</div>}
      </div>
    </SubPanelView>
  );
}
