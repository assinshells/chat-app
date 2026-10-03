import { useState } from "react";
import { useResetPasswordStore } from "@features/auth/reset-password/model/useResetPasswordStore.js";

export function ResetPasswordForm({ verifiedToken, onSuccess, onBack }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { loading, error, reset, clearError } = useResetPasswordStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    reset({ verifiedToken, password, confirmPassword }, onSuccess);
  };

  return (
    <>
      {error && <p className="text-danger text-center mb-3">{error}</p>}
      <form onSubmit={handleSubmit} role="form"
        className="mx-auto text-center auth-form">
        <div className="mb-3">
          <input
            id="passwordInput"
            type="password"
            className="form-control"
            placeholder="Введіть новий пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <input
            id="confirmPasswordInput"
            type="password"
            className="form-control"
            placeholder="Повторити пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-5 d-grid gap-2">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? "Зберігаємо..." : "Зберегти"}
        </button>
        <button
            type="button"
            onClick={(e) => {
            e.preventDefault();
            onBack();
          }}
            className="btn btn-secondary"
          >
            Увійти
          </button>
        </div>
      </form>
    </>
  );
}