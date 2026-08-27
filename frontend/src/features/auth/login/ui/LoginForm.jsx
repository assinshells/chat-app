import { useState } from "react";
import { useLoginStore } from "@features/auth/login/model/useLoginStore.js";

/**
 * LoginForm — тупой компонент.
 * onSuccess(login) — вызывается с логином после успешного входа.
 */
export function LoginForm({ onSuccess, onRegister, onForgot }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const { loading, error, login: doLogin, clearError } = useLoginStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    doLogin({ login, password }, () => onSuccess(login));
  };

  return (
    <>
      {error && <p className="text-danger text-center mb-3">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <input
            id="loginInput"
            type="text"
            className="form-control"
            placeholder="Введіть нікнейм"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <input
            id="passwordInput"
            type="password"
            className="form-control"
            placeholder="Введіть пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-100 text-decoration-none rounded-4 fw-bold m-0"
        >
          {loading ? "Заходимо..." : "Увійти"}
        </button>
      </form>
      <button
        type="button"
        onClick={onForgot}
        className="btn btn-outline-primary w-100 text-break rounded-4 fw-bold mt-3"
      >
        Забули пароль?
      </button>

      <button
        type="button"
        onClick={onRegister}
        className="btn btn-outline-primary w-100 text-break rounded-4 fw-bold mt-4"
      >
        Зареєструватися
      </button>
    </>
  );
}