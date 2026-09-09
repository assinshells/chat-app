import { Fragment, useState } from "react";
import { useLoginStore } from "@features/auth/login/model/useLoginStore.js";
import { ROOMS, DEFAULT_ROOM } from "@features/chat/constants/rooms.constants.js";
import { GENDER_OPTIONS, DEFAULT_GENDER } from "@shared/constants/auth.constants.js";
import {
  getColorLabel,
  getColorHex,
  getColorHexDark,
  getVisibleColorOptions,
  getDefaultColorForTheme,
} from "@shared/constants/color.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";

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

  // "Чорний" за замовчуванням доречний лише на світлій темі (на темній
  // він майже нечитабельний і взагалі прибраний з палітри нижче) —
  // тому початкове значення підлаштовується під тему вже при монтуванні.
  const isDarkTheme = useIsDarkTheme();
  const [color, setColor] = useState(() => getDefaultColorForTheme(isDarkTheme));
  const visibleColorOptions = getVisibleColorOptions(isDarkTheme);

  // effectiveColor замість синхронізації через useEffect: якщо тема
  // змінюється просто під час заповнення форми (перемикач теми на
  // цьому екрані відсутній, але системна прив'язка prefers-color-scheme
  // могла спрацювати) і збережений вибір саме той, що ховається на
  // новій темі ("чорний" на темній / "білий" на світлій) — на льоту
  // підміняється симетричним дефолтом. Порахований прямо в рендері,
  // без побічного ефекту й зайвого re-render.
  const effectiveColor = visibleColorOptions.some((option) => option.value === color)
    ? color
    : getDefaultColorForTheme(isDarkTheme);

  const { loading, error, login: doLogin, clearError } = useLoginStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    doLogin({ login, password, gender, color: effectiveColor }, () => onSuccess(login, room));
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

        <div className="mb-3">
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

        <div className="gender-pill-group mb-3" role="group" aria-label="Стать">
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
              <label className="gender-pill-btn" htmlFor={`gender-${option.value}`}>
                {option.label}
              </label>
            </Fragment>
          ))}
        </div>

        <div className="mb-4">
          <div className="color-radio-options">
            {visibleColorOptions.map((option) => (
              <label
                key={option.value}
                className="color-radio-option"
                style={{ "--swatch-color": option.hex, "--swatch-color-dark": option.hexDark ?? option.hex }}
                data-tooltip={option.label}
              >
                <span className="color-radio-swatch" aria-hidden="true" />
                <input
                  className="color-radio-input"
                  type="radio"
                  name="color"
                  value={option.value}
                  checked={effectiveColor === option.value}
                  onChange={(e) => setColor(e.target.value)}
                  required
                  aria-label={option.label}
                />
              </label>
            ))}
          </div>
          {/*
            Підпис пофарбований у сам обраний колір - саме так нік/
            повідомлення виглядатиме в чаті (а не нейтральним текстом,
            як було раніше). isDarkTheme перемикає між hex і hexDark,
            щоб підпис лишався настільки ж читабельним, як і сам свотч.
          */}
          <p
            className="color-radio-selected-name mb-0"
            style={{ color: isDarkTheme ? getColorHexDark(effectiveColor) : getColorHex(effectiveColor) }}
          >
            {getColorLabel(effectiveColor)}
          </p>
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
