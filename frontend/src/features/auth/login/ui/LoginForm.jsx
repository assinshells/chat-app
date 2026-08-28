import { useState } from "react";
import { useLoginStore } from "@features/auth/login/model/useLoginStore.js";
import { ROOMS, DEFAULT_ROOM } from "@features/chat/constants/rooms.constants.js";

/**
 * LoginForm — тупой компонент.
 * onSuccess(login, room) — вызывается с логином и выбранной комнатой
 * после успешного входа, чтобы сразу открыть чат в нужной комнате.
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