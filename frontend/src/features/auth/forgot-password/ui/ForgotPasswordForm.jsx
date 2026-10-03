import { useState } from "react";
import { useForgotPasswordStore } from "@features/auth/forgot-password/model/useForgotPasswordStore.js";

export function ForgotPasswordForm({ onSuccess, onBack }) {
  const [email, setEmail] = useState("");
  const { loading, error, submit, clearError } = useForgotPasswordStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    submit({ email }, () => onSuccess(email));
  };

  return (
    <>
      {error && <p className="text-danger text-center mb-3">{error}</p>}
      <form onSubmit={handleSubmit} role="form"
        className="mx-auto text-center auth-form">
        <div className="mb-3">
          <input
            id="emailInput"
            type="email"
            className="form-control"
            placeholder="Введіть пошту"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-5 d-grid gap-2">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? "Відправляємо..." : "Відправити код"}
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