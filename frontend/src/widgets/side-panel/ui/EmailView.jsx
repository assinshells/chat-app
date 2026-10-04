import { useState } from "react";

import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { updateEmail } from "@shared/api/profile.api.js";
import { SubPanelView } from "./SubPanelView.jsx";

const MAX_EMAIL_LENGTH = 255;

// Той самий шаблон, що й на бекенді (validators/auth.validator.js).
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/**
 * EmailView — вкладена панель "Ел. адреса": поле вводу (з поточним email,
 * якщо його вказано), валідація, підказка про призначення адреси і кнопка
 * "Зберегти" внизу (активна, коли адреса змінена і дійсна).
 */
export function EmailView({ onBack }) {
  const email = useCurrentUserStore((state) => state.email);
  const setEmail = useCurrentUserStore((state) => state.setEmail);

  const savedEmail = (email ?? "").trim();
  const [text, setText] = useState(() => email ?? "");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const trimmed = text.trim();
  const isValid = isValidEmail(trimmed);
  const isChanged = trimmed !== savedEmail;
  const showInvalid = touched && trimmed !== "" && !isValid;

  const handleSave = async () => {
    if (!isChanged || !isValid || saving) return;
    setSaving(true);
    setError("");
    try {
      const result = await updateEmail(trimmed);
      setEmail(result.email);
      onBack();
    } catch (err) {
      setError(err?.message || "Не вдалося зберегти. Спробуйте ще раз.");
      setSaving(false);
    }
  };

  return (
    <SubPanelView
      title="Ел. адреса"
      onBack={onBack}
      footer={
        <button
          type="button"
          className="btn btn-primary fw-bold w-100"
          disabled={!isChanged || !isValid || saving}
          onClick={handleSave}
        >
          {saving ? "Зберігаємо..." : "Зберегти"}
        </button>
      }
    >
      <div className="p-3">
        <label htmlFor="email-input" className="mb-2 text-muted small d-block">
          Ваша ел. адреса
        </label>

        <input
          id="email-input"
          type="email"
          className={`form-control ${showInvalid ? "is-invalid" : ""}`}
          maxLength={MAX_EMAIL_LENGTH}
          placeholder="name@example.com"
          autoComplete="email"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={showInvalid}
        />

        {showInvalid && (
          <div className="invalid-feedback d-block">
            Введіть дійсну ел. адресу
          </div>
        )}

        <div className="text-muted small mt-2">
          Ел. адреса потрібна лише для відновлення пароля і ніде не
          відображається.
        </div>

        {error && <div className="text-danger small mt-2">{error}</div>}
      </div>
    </SubPanelView>
  );
}
