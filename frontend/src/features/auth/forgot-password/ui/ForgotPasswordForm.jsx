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
    <form onSubmit={handleSubmit} role="form" className="auth-form">
      <div className="auth-fields">
        {error && <p className="text-danger mb-0">{error}</p>}

        <div>
          <input
            id="emailInput"
            type="email"
            className="form-control"
            placeholder="Електронна пошта"
            aria-label="Електронна пошта"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-100"
        >
          {loading ? "Відправляємо..." : "Відправити код"}
        </button>
      </div>
    </form>
  );
}
