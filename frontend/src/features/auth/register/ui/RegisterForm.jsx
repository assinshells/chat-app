import { useState } from "react";
import { useRegisterStore } from "@features/auth/register/model/useRegisterStore.js";
import {
  DEFAULT_GENDER,
  getGenderLabel,
} from "@shared/constants/auth.constants.js";
import {
  getColorLabel,
  getEffectiveColorHex,
  getVisibleColorOptions,
  getDefaultColorForTheme,
} from "@shared/constants/color.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";
import { RulesModal } from "@features/info/ui/RulesModal.jsx";
import { ColorPickerModal } from "./ColorPickerModal.jsx";
import { GenderPickerModal } from "./GenderPickerModal.jsx";

// Окремі id, щоб не конфліктувати з однойменними модалками деінде
// (RulesModal.jsx монтується в сайдбарі лише для залогінених
// користувачів, тож перетину насправді не буває, але id все одно
// тримаємо унікальними).
const REGISTER_RULES_MODAL_ID = "registerRulesModal";
const REGISTER_COLOR_MODAL_ID = "registerColorPickerModal";
const REGISTER_GENDER_MODAL_ID = "registerGenderPickerModal";

// Той самий ліміт, що й на бекенді (див.
// backend/src/validators/auth.validator.js, MAX_LOGIN_LENGTH) —
// довший нікнейм сервер все одно відхилить, тому обрізаємо ще на вводі.
const MAX_LOGIN_LENGTH = 20;

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

        <div className="mb-4 d-flex align-items-center justify-content-between gender-color-row">
          {/*
            Стать і колір — той самий патерн, що й поле "Кімната" на
            формі входу (LoginForm.jsx, .room-select-label +
            .room-select-trigger — лейбл звичайним текстом, значення —
            підкреслений клікабельний тригер): відкривають окремі
            модалки (GenderPickerModal.jsx / ColorPickerModal.jsx, той
            самий "безшапковий" патерн, що й RoomSelectModal — без
            заголовка й футера, лише хрестик закриття). У статі вибір
            застосовується одразу по кліку на варіант у модалці (як і в
            RoomSelectModal) — без окремої кнопки "Прийняти"; у кольору
            — по кнопці "Прийняти" (там ще й приклад тексту обраним
            кольором, який варто встигнути роздивитись).

            Колір, на відміну від статі, має власний візуальний
            індикатор — кружок, пофарбований обраним кольором, — тому
            замість тексту з назвою кольору (це дублювало б інформацію,
            яку й так передає колір кружка) тут просто лейбл "Колір" і
            сам кружок як тригер модалки.

            В одному рядку на всю ширину форми: стать — по лівому краю
            (start), колір — по правому (end).

            "Чоловік" за замовчуванням (DEFAULT_GENDER), "Чорний"/"Білий"
            за замовчуванням (getDefaultColorForTheme) — інші варіанти
            обираються серед усіх (GENDER_OPTIONS, включно з "Не
            вказано") / видимих у модалці (getVisibleColorOptions).
          */}
          <span>
            <span className="room-select-label">Стать: </span>
            <button
              type="button"
              className="room-select-trigger"
              data-bs-toggle="modal"
              data-bs-target={`#${REGISTER_GENDER_MODAL_ID}`}
            >
              {getGenderLabel(gender)}
            </button>
          </span>

          <span className="d-flex align-items-center gap-2">
            <span className="room-select-label">Колір: </span>
            <button
              type="button"
              className="color-select-trigger"
              data-bs-toggle="modal"
              data-bs-target={`#${REGISTER_COLOR_MODAL_ID}`}
              style={{
                backgroundColor: getEffectiveColorHex(effectiveColor, isDarkTheme),
              }}
              aria-label={`Колір: ${getColorLabel(effectiveColor)}`}
            />
          </span>
        </div>

        <p className="text-muted small mb-2 text-center">
          Натискаючи «Зареєструватися», ви погоджуєтеся з{" "}
          <a
            href="#"
            data-bs-toggle="modal"
            data-bs-target={`#${REGISTER_RULES_MODAL_ID}`}
            onClick={(e) => e.preventDefault()}
          >
            правилами чату
          </a>
          .
        </p>
        <div className="mb-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-100"
          >
            {loading ? "Реєструємо..." : "Зареєструватися"}
          </button>
        </div>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onBack();
          }}
          className="forgot-password-link text-muted mb-4 d-inline-block"
        >
          Увійти
        </a>
      </form>

      <RulesModal modalId={REGISTER_RULES_MODAL_ID} />
      <ColorPickerModal
        modalId={REGISTER_COLOR_MODAL_ID}
        color={effectiveColor}
        onConfirm={setColor}
      />
      <GenderPickerModal
        modalId={REGISTER_GENDER_MODAL_ID}
        gender={gender}
        onConfirm={setGender}
      />
    </>
  );
}
