import { useState } from "react";
import { useRegisterStore } from "@features/auth/register/model/useRegisterStore.js";

// Той самий ліміт, що й на бекенді (див.
// backend/src/validators/auth.validator.js, MAX_LOGIN_LENGTH) —
// довший нікнейм сервер все одно відхилить, тому обрізаємо ще на вводі.
const MAX_LOGIN_LENGTH = 20;

export function RegisterForm({ onSuccess, onBack }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const { loading, error, register, clearError } = useRegisterStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    register({ login, password, email }, onSuccess);
  };

  return (
    <>
      {error && <p className="text-danger text-center mb-3">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          {/* Лічильник символів нікнейма перенесено всередину інпута
              (position: absolute відносно .input-with-counter, див.
              app.css) замість окремого form-text під полем. */}
          <div className="input-with-counter">
            <input
              id="loginInput"
              type="text"
              className="form-control"
              placeholder="Введіть нікнейм"
              value={login}
              maxLength={MAX_LOGIN_LENGTH}
              onChange={(e) => setLogin(e.target.value.slice(0, MAX_LOGIN_LENGTH))}
              required
            />
            <span className="input-inline-counter" aria-hidden="true">
              {login.length}/{MAX_LOGIN_LENGTH}
            </span>
          </div>
        </div>
        <div className="mb-3">
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
        <div className="mb-3">
          <input
            id="emailInput"
            type="email"
            className="form-control"
            placeholder="Введіть пошту (опціонально)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-100 text-decoration-none rounded-4 fw-bold m-0"
        >
          {loading ? "Реєструємо..." : "Зареєструватися"}
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
