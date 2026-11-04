import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLoginStore } from "@features/auth/login/model/useLoginStore.js";
import {
  DEFAULT_ROOM,
  MAIN_ROOMS,
  MAIN_ROOM_IDS,
  THEMATIC_ROOMS,
  THEMATIC_ROOM_IDS,
  CITY_ROOMS,
} from "@features/chat/constants/rooms.constants.js";

/**
 * LoginForm — єдина форма входу й початку реєстрації: нікнейм, пароль,
 * вибір кімнати та кнопка входу. Окремого посилання на реєстрацію немає.
 *
 * Що буде далі, вирішує сервер (POST /api/auth/login):
 *  - логін є, пароль вірний   -> onSuccess(login, room) -> чат у кімнаті room;
 *  - логін є, пароль хибний   -> повідомлення про помилку на цій формі;
 *  - логіна немає             -> onRegistrationRequired({ login, room })
 *    -> сторінка завершення реєстрації (кімната обирається тут і
 *    переноситься далі, щоб після реєстрації відкрити чат у ній).
 *
 * Без підписів над полями — замість них placeholder (+ aria-label).
 * Кімната — один блок із двох частин: радіокнопки (Головна, Київ,
 * Бєспрєдєл) і два селекти (тематичні та міста). Обрана кімната
 * завжди одна: вибір в одній частині скидає вибір в іншій.
 *
 * Структура: .auth-stack (відступ 32px) → [.auth-fields (поля +
 * кнопка, відступ 16px), .auth-links].
 */
export function LoginForm({ onSuccess, onRegistrationRequired, onForgot }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [room, setRoom] = useState(DEFAULT_ROOM);

  const { loading, error, login: doLogin, clearError } = useLoginStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    doLogin(
      { login, password },
      {
        onSuccess: () => onSuccess(login, room),
        onRegistrationRequired: () =>
          onRegistrationRequired({ login, room }),
      },
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit} role="form" className="auth-form">
        <div className="auth-stack">
          <div className="auth-fields">
            {error && <p className="text-danger mb-0">{error}</p>}

            <div>
              <input
                id="loginInput"
                type="text"
                className="form-control"
                placeholder="Нікнейм"
                aria-label="Нікнейм"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
              />
            </div>

            {/* Глазик показати/сховати пароль — усередині інпута,
                справа (.input-with-toggle, див. _forms.css) — так
                само, як на формі реєстрації. */}
            <div>
              <div className="input-with-toggle">
                <input
                  id="passwordInput"
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Пароль"
                  aria-label="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-toggle-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Сховати пароль" : "Показати пароль"
                  }
                  aria-pressed={showPassword}
                  title={showPassword ? "Сховати пароль" : "Показати пароль"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Кімната: блок із двох частин. Ліва/верхня — радіокнопки
                в стовпчик, права/нижня — два селекти в стовпчик.
                room — єдине джерело істини: у кожній частині значення
                показується лише якщо кімната належить її групі. */}
            <div className="room-block" role="group" aria-label="Кімната">
              <div className="room-block-part">
                {MAIN_ROOMS.map((r) => (
                  <div className="form-check mb-0" key={r.id}>
                    <input
                      className="form-check-input"
                      type="radio"
                      name="loginRoom"
                      id={`loginRoom-${r.id}`}
                      value={r.id}
                      checked={room === r.id}
                      onChange={() => setRoom(r.id)}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`loginRoom-${r.id}`}
                    >
                      {r.name}
                    </label>
                  </div>
                ))}
              </div>

              <div className="room-block-part">
                <select
                  className="form-select"
                  aria-label="Тематична кімната"
                  value={THEMATIC_ROOM_IDS.includes(room) ? room : ""}
                  onChange={(e) => setRoom(e.target.value)}
                >
                  <option value="" disabled>
                    Тематичні
                  </option>
                  {THEMATIC_ROOMS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>

                <select
                  className="form-select"
                  aria-label="Місто"
                  value={
                    !MAIN_ROOM_IDS.includes(room) &&
                    !THEMATIC_ROOM_IDS.includes(room)
                      ? room
                      : ""
                  }
                  onChange={(e) => setRoom(e.target.value)}
                >
                  <option value="" disabled>
                    Місто
                  </option>
                  {CITY_ROOMS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100"
            >
              {loading ? "Заходимо..." : "Увійти в чат"}
            </button>
          </div>

          {/* Під кнопкою лишається лише "Забули пароль?" — відновлення
              пароля не належить до старого процесу реєстрації. */}
          <div className="auth-links">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onForgot();
              }}
            >
              Забули пароль?
            </a>
          </div>
        </div>
      </form>
    </>
  );
}
