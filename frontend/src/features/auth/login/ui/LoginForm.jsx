import { useState } from "react";
import { useLoginStore } from "@features/auth/login/model/useLoginStore.js";
import {
  ROOMS,
  DEFAULT_ROOM,
} from "@features/chat/constants/rooms.constants.js";

/**
 * LoginForm — "тупий" компонент.
 * onSuccess(login, room) — викликається з логіном і обраною кімнатою
 * після успішного входу, щоб одразу відкрити чат у потрібній кімнаті.
 *
 * Стать і колір нікнейма/повідомлень тепер обираються на формі
 * реєстрації (див. RegisterForm.jsx), а не тут — форма входу лише
 * автентифікує вже наявного користувача.
 */
export function LoginForm({ onSuccess, onRegister, onForgot }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [room, setRoom] = useState(DEFAULT_ROOM);

  const { loading, error, login: doLogin, clearError } = useLoginStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    doLogin({ login, password }, () => onSuccess(login, room));
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
        
        <div className="mb-4 d-flex gap-2 auth-button-row">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? "Заходимо..." : "Увійти"}
          </button>
          <button
            type="button"
            onClick={onRegister}
            className="btn btn-secondary"
          >
            Зареєструватися
          </button>
        </div>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onForgot();
          }}
          className="forgot-password-link text-muted mb-2 d-inline-block"
        >
          Забули пароль?
        </a>
      </form>
    </>
  );
}