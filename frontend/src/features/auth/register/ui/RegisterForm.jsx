import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRegisterStore } from "@features/auth/register/model/useRegisterStore.js";
import {
  DEFAULT_GENDER,
  GENDER_OPTIONS,
} from "@shared/constants/auth.constants.js";
import {
  getColorLabel,
  getEffectiveColorHex,
  getVisibleColorOptions,
  getDefaultColorForTheme,
} from "@shared/constants/color.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";
import { RulesModal } from "@features/info/ui/RulesModal.jsx";
import { CookiesModal } from "@features/info/ui/CookiesModal.jsx";
import { ColorPickerModal } from "./ColorPickerModal.jsx";

// Окремі id, щоб не конфліктувати з однойменними модалками деінде
// (RulesModal.jsx монтується в сайдбарі лише для залогінених
// користувачів, тож перетину насправді не буває, але id все одно
// тримаємо унікальними).
const REGISTER_RULES_MODAL_ID = "registerRulesModal";
const REGISTER_COLOR_MODAL_ID = "registerColorPickerModal";
const REGISTER_COOKIES_MODAL_ID = "registerCookiesModal";

// Той самий ліміт, що й на бекенді (див.
// backend/src/validators/auth.validator.js, MAX_LOGIN_LENGTH) —
// довший нікнейм сервер все одно відхилить, тому обрізаємо ще на вводі.
const MAX_LOGIN_LENGTH = 20;

// Мінімальна довжина нікнейма, узгоджена з бекендом (MIN_LOGIN_LENGTH у
// backend/src/validators/auth.validator.js). На відміну від
// MAX_LOGIN_LENGTH це не обрізає ввід, а лише перевіряється при
// сабміті (minLength на інпуті + перевірка в handleSubmit нижче).
const MIN_LOGIN_LENGTH = 3;

// Мінімальна довжина пароля, узгоджена з бекендом (isValidPassword у
// backend/src/validators/auth.validator.js).
const MIN_PASSWORD_LENGTH = 6;

/**
 * Стать і колір нікнейма/повідомлень обираються тут, а не на формі
 * входу (LoginForm.jsx) і не в модалці налаштувань
 * чату: обидва значення йдуть одразу в тілі
 * POST /api/auth/register, окремих PATCH-запитів після логіну більше
 * не потрібно (див. useRegisterStore.js).
 */
export function RegisterForm({ onSuccess, onBack }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState(DEFAULT_GENDER);
  const [showPassword, setShowPassword] = useState(false);

  // "Чорний" за замовчуванням доречний лише на світлій темі (на темній
  // він майже нечитабельний і взагалі прибраний з палітри нижче) —
  // тому початкове значення підлаштовується під тему вже при монтуванні.
  const isDarkTheme = useIsDarkTheme();
  const [color, setColor] = useState(() =>
    getDefaultColorForTheme(isDarkTheme),
  );
  const visibleColorOptions = getVisibleColorOptions(isDarkTheme);

  // effectiveColor замість синхронізації через useEffect: якщо тема
  // змінюється просто під час заповнення форми і збережений вибір саме
  // той, що ховається на новій темі ("чорний" на темній / "білий" на
  // світлій) — на льоту підміняється симетричним дефолтом. Порахований
  // прямо в рендері, без побічного ефекту й зайвого re-render.
  const effectiveColor = visibleColorOptions.some(
    (option) => option.value === color,
  )
    ? color
    : getDefaultColorForTheme(isDarkTheme);

  const { loading, error, register, clearError } = useRegisterStore();

  // Назва кольору при наведенні на свотч — нативний браузерний тултип
  // від атрибута title на .color-radio-option (див. нижче), без
  // додаткової JS-ініціалізації.

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    register(
      { login, password, email, gender, color: effectiveColor },
      onSuccess,
    );
  };

  return (
    <>
      {error && <p className="text-danger text-center mb-3">{error}</p>}
      <form onSubmit={handleSubmit} role="form"
        className="mx-auto text-center auth-form">
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
              minLength={MIN_LOGIN_LENGTH}
              maxLength={MAX_LOGIN_LENGTH}
              onChange={(e) =>
                setLogin(e.target.value.slice(0, MAX_LOGIN_LENGTH))
              }
              required
            />
            <span className="input-inline-counter" aria-hidden="true">
              {login.length}/{MAX_LOGIN_LENGTH}
            </span>
          </div>
        </div>
        <div className="mb-3">
          {/* Глазик показати/сховати пароль — усередині інпута, справа
              (.input-with-toggle, див. _forms.css). */}
          <div className="input-with-toggle">
            <input
              id="passwordInput"
              type={showPassword ? "text" : "password"}
              className="form-control"
              placeholder="Введіть пароль"
              value={password}
              minLength={MIN_PASSWORD_LENGTH}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="input-toggle-btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Сховати пароль" : "Показати пароль"}
              aria-pressed={showPassword}
              title={showPassword ? "Сховати пароль" : "Показати пароль"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
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

        {/* Стать — звичайні радіокнопки (без модалки). */}
        <div className="mb-3 d-flex align-items-center justify-content-between gender-radio-row">
          {GENDER_OPTIONS.map((option) => (
            <div className="form-check mb-0" key={option.value}>
              <input
                className="form-check-input"
                type="radio"
                name="registerGender"
                id={`registerGender-${option.value}`}
                value={option.value}
                checked={gender === option.value}
                onChange={() => setGender(option.value)}
              />
              <label
                className="form-check-label"
                htmlFor={`registerGender-${option.value}`}
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>

        {/* Колір — той самий патерн, що й поле "Кімната" на формі входу
            (LoginForm.jsx): readOnly-інпут з назвою кольору, пофарбованою
            в обраний колір; клік (або Enter/Пробіл) відкриває
            ColorPickerModal. form-select додає шеврон. */}
        <div className="mb-4">
          <input
            id="colorInput"
            type="text"
            className="form-select room-select-input color-select-input"
            value={getColorLabel(effectiveColor)}
            readOnly
            aria-label="Колір"
            aria-haspopup="dialog"
            data-bs-toggle="modal"
            data-bs-target={`#${REGISTER_COLOR_MODAL_ID}`}
            style={{ color: getEffectiveColorHex(effectiveColor, isDarkTheme) }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.currentTarget.click();
              }
            }}
          />
        </div>

        <p className="text-muted small mb-3 text-start">
          Натискаючи «Зареєструватися», ви підтверджуєте, що вам виповнилося
          18 років, і приймаєте{" "}
          <a
            href="#"
            data-bs-toggle="modal"
            data-bs-target={`#${REGISTER_RULES_MODAL_ID}`}
            onClick={(e) => e.preventDefault()}
          >
            Правила чату
          </a>
          . Для роботи сайту використовуються необхідні файли cookie —
          докладніше в{" "}
          <a
            href="#"
            data-bs-toggle="modal"
            data-bs-target={`#${REGISTER_COOKIES_MODAL_ID}`}
            onClick={(e) => e.preventDefault()}
          >
            Політиці cookie
          </a>
          .
        </p>
        <div className="mb-5 d-grid gap-2">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? "Реєструємо..." : "Зареєструватися"}
          </button>
          <button
            type="button"
            onClick={(e) => {
            e.preventDefault();
            onBack();
          }}
            className="btn btn-secondary"
          >
            Увійти
          </button>
        </div>
      </form>

      <RulesModal modalId={REGISTER_RULES_MODAL_ID} bare />
      <CookiesModal modalId={REGISTER_COOKIES_MODAL_ID} />
      <ColorPickerModal
        modalId={REGISTER_COLOR_MODAL_ID}
        color={effectiveColor}
        onConfirm={setColor}
      />
    </>
  );
}
