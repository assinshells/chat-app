import { useState } from "react";
import { useResetPasswordStore } from "@features/auth/reset-password/model/useResetPasswordStore.js";

export function ResetPasswordForm({ verifiedToken, onSuccess }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { loading, error, reset, clearError } = useResetPasswordStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    reset({ verifiedToken, password, confirmPassword }, onSuccess);
  };

  return (
    <form onSubmit={handleSubmit} role="form" className="auth-form">
      <div className="auth-fields">
        {error && <p className="text-danger mb-0">{error}</p>}

        <div>
          <input
            id="passwordInput"
            type="password"
            className="form-control"
            placeholder="Новий пароль"
            aria-label="Новий пароль"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <input
            id="confirmPasswordInput"
            type="password"
            className="form-control"
            placeholder="Повторіть пароль"
            aria-label="Повторіть пароль"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-100"
        >
          {loading ? "Зберігаємо..." : "Зберегти"}
        </button>
      </div>
    </form>
  );
}
