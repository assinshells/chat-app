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
    <form
      onSubmit={handleSubmit}
      role="form"
      className="mx-auto text-center auth-form"
    >
      <div className="auth-fields">
        {error && <p className="text-danger text-center mb-0">{error}</p>}

        <div className="form-floating">
          <input
            id="passwordInput"
            type="password"
            className="form-control auth-input"
            placeholder="Новий пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label htmlFor="passwordInput">Новий пароль</label>
        </div>

        <div className="form-floating">
          <input
            id="confirmPasswordInput"
            type="password"
            className="form-control auth-input"
            placeholder="Повторіть пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <label htmlFor="confirmPasswordInput">Повторіть пароль</label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary auth-btn"
        >
          {loading ? "Зберігаємо..." : "Зберегти"}
        </button>
      </div>
    </form>
  );
}