import { Fragment, useState } from "react";
import { useLoginStore } from "@features/auth/login/model/useLoginStore.js";
import { ROOMS, DEFAULT_ROOM } from "@features/chat/constants/rooms.constants.js";
import { GENDER_OPTIONS, DEFAULT_GENDER } from "@shared/constants/auth.constants.js";
import { COLOR_OPTIONS, DEFAULT_COLOR } from "@shared/constants/color.constants.js";

/**
 * LoginForm — "тупий" компонент.
 * onSuccess(login, room) — викликається з логіном і обраною кімнатою
 * після успішного входу, щоб одразу відкрити чат у потрібній кімнаті.
 *
 * Стать і колір нікнейма/повідомлень обираються тут, а не на формі
 * реєстрації (див. RegisterForm.jsx) і не в модалці налаштувань чату
 * (SettingsModal.jsx, звідки їх прибрано): при вході useLoginStore
 * одразу після успішної автентифікації зберігає їх через
 * PATCH /api/auth/gender і /api/auth/color.
 */
export function LoginForm({ onSuccess, onRegister, onForgot }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [room, setRoom] = useState(DEFAULT_ROOM);
  const [gender, setGender] = useState(DEFAULT_GENDER);
  const [color, setColor] = useState(DEFAULT_COLOR);
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

        <div className="btn-group w-100 mb-3" role="group" aria-label="Стать">
          {GENDER_OPTIONS.map((option) => (
            <Fragment key={option.value}>
              <input
                type="radio"
                className="btn-check"
                name="gender"
                id={`gender-${option.value}`}
                autoComplete="off"
                value={option.value}
                checked={gender === option.value}
                onChange={(e) => setGender(e.target.value)}
                required
              />
              <label className="btn btn-outline-primary" htmlFor={`gender-${option.value}`}>
                {option.label}
              </label>
            </Fragment>
          ))}
        </div>

        <div className="color-swatch-options mb-4">
          {COLOR_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`color-swatch-option ${
                color === option.value ? "is-active" : ""
              }`}
              style={{ "--swatch-color": option.hex }}
            >
              <input
                className="color-swatch-input"
                type="radio"
                name="color"
                value={option.value}
                checked={color === option.value}
                onChange={(e) => setColor(e.target.value)}
                required
                aria-label={option.label}
              />
              <span className="color-swatch" aria-hidden="true" />
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
