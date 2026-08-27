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
      <form onSubmit={handleSubmit}>
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
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-100 text-decoration-none rounded-4 fw-bold m-0"
        >
          {loading ? "Відправляємо..." : "Відправити код"}
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