import { useState } from "react";
import { useLoginStore } from "@features/auth/login/model/useLoginStore.js";
import { ROOMS, DEFAULT_ROOM } from "@features/chat/constants/rooms.constants.js";
import { GENDER_OPTIONS } from "@shared/constants/auth.constants.js";
import { COLOR_OPTIONS } from "@shared/constants/color.constants.js";

/**
 * LoginForm — "тупий" компонент.
 * onSuccess(login, room) — викликається з логіном і обраною кімнатою
 * після успішного входу, щоб одразу відкрити чат у потрібній кімнаті.
 *
 * Стать і колір нікнейма/повідомлень тепер обираються тут, а не на
 * формі реєстрації (див. RegisterForm.jsx): при вході useLoginStore
 * одразу після успішної автентифікації зберігає їх через
 * PATCH /api/auth/gender і /api/auth/color.
 */
export function LoginForm({ onSuccess, onRegister, onForgot }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [room, setRoom] = useState(DEFAULT_ROOM);
  const [gender, setGender] = useState("");
  const [color, setColor] = useState("");
  const { loading, error, login: doLogin, clearError } = useLoginStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    doLogin({ login, password, gender, color }, () => onSuccess(login, room));
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

        <div className="mb-4">
          <select
            id="roomSelect"
            className="form-select"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            aria-label="Кімната для входу"
          >
            {ROOMS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
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

        <label className="mb-2 text-muted small d-block">
          Колір ваших повідомлень і ніка
        </label>
        <div className="settings-color-options mb-4">
          {COLOR_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`settings-color-option ${
                color === option.value ? "is-active" : ""
              }`}
              style={{ "--settings-swatch-color": option.hex }}
            >
              <input
                className="settings-color-input"
                type="radio"
                name="color"
                value={option.value}
                checked={color === option.value}
                onChange={(e) => setColor(e.target.value)}
                required
              />
              <span className="settings-color-swatch" aria-hidden="true" />
              <span className="settings-color-label">{option.label}</span>
            </label>
          ))}
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
