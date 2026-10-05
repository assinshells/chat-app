import { useState } from "react";

import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { updateDisplayName } from "@shared/api/profile.api.js";
import { SubPanelView } from "./SubPanelView.jsx";

const MAX_NAME_LENGTH = 120;

/**
 * NameView — вкладена панель "Ваше ім'я": поле вводу і кнопка "Зберегти"
 * внизу (активна, коли значення змінилось; порожнє значення очищає ім'я).
 */
export function NameView({ onBack }) {
  const displayName = useCurrentUserStore((state) => state.displayName);
  const setDisplayName = useCurrentUserStore((state) => state.setDisplayName);

  const savedName = (displayName ?? "").trim();
  const [text, setText] = useState(() => displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isChanged = text.trim() !== savedName;

  const handleSave = async () => {
    if (!isChanged || saving) return;
    setSaving(true);
    setError("");
    try {
      const result = await updateDisplayName(text.trim());
      setDisplayName(result.displayName);
      onBack();
    } catch {
      setError("Не вдалося зберегти. Спробуйте ще раз.");
      setSaving(false);
    }
  };

  return (
    <SubPanelView
      title="Ваше ім'я"
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
        <label htmlFor="name-input" className="mb-2 text-muted small d-block">
          Ваше ім'я
        </label>

        <input
          id="name-input"
          type="text"
          className="form-control"
          maxLength={MAX_NAME_LENGTH}
          placeholder="Ваше ім'я"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {error && <div className="text-danger small mt-2">{error}</div>}
      </div>
    </SubPanelView>
  );
}
