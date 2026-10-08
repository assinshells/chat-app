import { useState } from "react";
import { useForgotPasswordStore } from "@features/auth/forgot-password/model/useForgotPasswordStore.js";

export function ForgotPasswordForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const { loading, error, submit, clearError } = useForgotPasswordStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    submit({ email }, () => onSuccess(email));
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
            id="emailInput"
            type="email"
            className="form-control auth-input"
            placeholder="Пошта"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="emailInput">Пошта</label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary auth-btn"
        >
          {loading ? "Відправляємо..." : "Відправити код"}
        </button>
      </div>
    </form>
  );
}