import { useState } from "react";
import { useRegisterStore } from "@features/auth/register/model/useRegisterStore.js";
import { GENDER_OPTIONS, DEFAULT_GENDER } from "@shared/constants/auth.constants.js";
import {
  getColorLabel,
  getEffectiveColorHex,
  getVisibleColorOptions,
  getDefaultColorForTheme,
} from "@shared/constants/color.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";
import { RulesModal } from "@features/info/ui/RulesModal.jsx";
import { SafetyWarningModal } from "@features/info/ui/SafetyWarningModal.jsx";

// Окремі id, щоб не конфліктувати з модалкою правил у сайдбарі
// (RulesModal.jsx монтується там лише для залогінених користувачів,
// тож перетину насправді не буває, але id все одно тримаємо унікальними).
const REGISTER_RULES_MODAL_ID = "registerRulesModal";
const REGISTER_SAFETY_WARNING_MODAL_ID = "registerSafetyWarningModal";

// Той самий ліміт, що й на бекенді (див.
// backend/src/validators/auth.validator.js, MAX_LOGIN_LENGTH) —
// довший нікнейм сервер все одно відхилить, тому обрізаємо ще на вводі.
const MAX_LOGIN_LENGTH = 20;

/**
 * Стать і колір нікнейма/повідомлень обираються тут, а не на формі
 * входу (LoginForm.jsx) і не в модалці налаштувань
 * чату (SettingsModal.jsx): обидва значення йдуть одразу в тілі
 * POST /api/auth/register, окремих PATCH-запитів після логіну більше
 * не потрібно (див. useRegisterStore.js).
 */
export function RegisterForm({ onSuccess, onBack }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState(DEFAULT_GENDER);

  // "Чорний" за замовчуванням доречний лише на світлій темі (на темній
  // він майже нечитабельний і взагалі прибраний з палітри нижче) —
  // тому початкове значення підлаштовується під тему вже при монтуванні.
  const isDarkTheme = useIsDarkTheme();
  const [color, setColor] = useState(() => getDefaultColorForTheme(isDarkTheme));
  const visibleColorOptions = getVisibleColorOptions(isDarkTheme);

  // effectiveColor замість синхронізації через useEffect: якщо тема
  // змінюється просто під час заповнення форми і збережений вибір саме
  // той, що ховається на новій темі ("чорний" на темній / "білий" на
  // світлій) — на льоту підміняється симетричним дефолтом. Порахований
  // прямо в рендері, без побічного ефекту й зайвого re-render.
  const effectiveColor = visibleColorOptions.some((option) => option.value === color)
    ? color
    : getDefaultColorForTheme(isDarkTheme);

  const { loading, error, register, clearError } = useRegisterStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    register({ login, password, email, gender, color: effectiveColor }, onSuccess);
  };

  return (
    <>
      {error && <p className="text-danger text-center mb-3">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          {/* Лічильник символів нікнейма перенесено всередину інпута
              (position: absolute відносно .input-with-counter, див.
              app/styles/components/_forms.css) замість окремого
              form-text під полем. */}
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

        <div className="mb-3">
          <select
            id="genderSelect"
            className="form-select"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            aria-label="Стать"
            required
          >
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
            style={{ color: getEffectiveColorHex(effectiveColor, isDarkTheme) }}
          >
            {getColorLabel(effectiveColor)}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-100 text-decoration-none rounded-4 fw-bold m-0"
        >
          {loading ? "Реєструємо..." : "Зареєструватися"}
        </button>

        <p className="text-muted small text-center mt-2 mb-0">
          Натискаючи «Зареєструватися», ви погоджуєтеся з{" "}
          <a
            href="#"
            data-bs-toggle="modal"
            data-bs-target={`#${REGISTER_RULES_MODAL_ID}`}
            onClick={(e) => e.preventDefault()}
          >
            правилами чату
          </a>{" "}
          та{" "}
          <a
            href="#"
            data-bs-toggle="modal"
            data-bs-target={`#${REGISTER_SAFETY_WARNING_MODAL_ID}`}
            onClick={(e) => e.preventDefault()}
          >
            попередженням про безпеку
          </a>
          .
        </p>
      </form>

      <RulesModal modalId={REGISTER_RULES_MODAL_ID} />
      <SafetyWarningModal modalId={REGISTER_SAFETY_WARNING_MODAL_ID} />
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