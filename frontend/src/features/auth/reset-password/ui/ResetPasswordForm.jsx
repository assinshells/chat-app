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
      <form onSubmit={handleSubmit}>
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
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-100 text-decoration-none rounded-4 fw-bold m-0"
        >
          {loading ? "Зберігаємо..." : "Зберегти"}
        </button>
      </form>
      <p>
        <button
          type="button"
          onClick={onBack}
          className="btn btn-outline-primary w-100 text-break rounded-4 fw-bold mt-4"
        >
          Увійти
        </button>
      </p>
    </>
  );
}