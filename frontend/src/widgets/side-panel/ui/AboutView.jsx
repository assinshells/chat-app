import { useState } from "react";

import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { updateAbout } from "@shared/api/profile.api.js";
import { SubPanelView } from "./SubPanelView.jsx";

const MAX_ABOUT_LENGTH = 300;

/**
 * AboutView — вкладена панель "Про себе": лейбл, textarea, лічильник
 * символів (як у модалці зворотного зв'язку) і кнопка "Зберегти" внизу
 * (неактивна, поки текст не змінено; порожнє поле теж можна зберегти).
 */
export function AboutView({ onBack }) {
  const about = useCurrentUserStore((state) => state.about);
  const setAbout = useCurrentUserStore((state) => state.setAbout);

  const savedText = (about ?? "").trim();
  const [text, setText] = useState(() =>
    (about ?? "").slice(0, MAX_ABOUT_LENGTH),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Кнопка активна, коли текст змінився — зокрема коли поле очищено
  // (порожнє значення дозволено і стирає "Про себе").
  const isChanged = text.trim() !== savedText;

  const handleSave = async () => {
    if (!isChanged || saving) return;
    setSaving(true);
    setError("");
    try {
      const result = await updateAbout(text.trim());
      setAbout(result.about);
      onBack();
    } catch {
      setError("Не вдалося зберегти. Спробуйте ще раз.");
      setSaving(false);
    }
  };

  return (
    <SubPanelView
      title="Про себе"
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
        <label htmlFor="about-textarea" className="mb-2 text-muted small d-block">
          Розкажіть трохи про себе
        </label>

        <textarea
          id="about-textarea"
          className="form-control"
          rows={6}
          maxLength={MAX_ABOUT_LENGTH}
          placeholder="Про себе..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="d-flex justify-content-between align-items-center mt-2">
          <span className="chat-character-count">
            {text.length}/{MAX_ABOUT_LENGTH}
          </span>
        </div>

        {error && <div className="text-danger small mt-2">{error}</div>}
      </div>
    </SubPanelView>
  );
}
