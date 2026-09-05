import { useState } from "react";
import { useRegisterStore } from "@features/auth/register/model/useRegisterStore.js";
import { GENDER_OPTIONS } from "@shared/constants/auth.constants.js";

// Той самий ліміт, що й на бекенді (див.
// backend/src/validators/auth.validator.js, MAX_LOGIN_LENGTH) —
// довший нікнейм сервер все одно відхилить, тому обрізаємо ще на вводі.
const MAX_LOGIN_LENGTH = 20;

export function RegisterForm({ onSuccess, onBack }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const { loading, error, register, clearError } = useRegisterStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    register({ login, password, email, gender }, onSuccess);
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
            maxLength={MAX_LOGIN_LENGTH}
            onChange={(e) => setLogin(e.target.value.slice(0, MAX_LOGIN_LENGTH))}
            required
          />
          <div className="form-text text-end">
            {login.length}/{MAX_LOGIN_LENGTH}
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
        <label className="mb-2 text-muted small">Як ви себе ідентифікуєте?</label>
        <div className="d-flex align-items-center mb-3 px-0">
          {GENDER_OPTIONS.map((option) => (
            <div className="form-check me-3" key={option.value}>
              <input
                className="form-check-input"
                type="radio"
                name="gender"
                id={`gender-${option.value}`}
                value={option.value}
                checked={gender === option.value}
                onChange={(e) => setGender(e.target.value)}
                required
              />
              <label className="form-check-label" htmlFor={`gender-${option.value}`}>
                {option.label}
              </label>
            </div>
          ))}
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