import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLoginStore } from "@features/auth/login/model/useLoginStore.js";
import {
  ROOMS_BY_ID,
  DEFAULT_ROOM,
} from "@features/chat/constants/rooms.constants.js";
import { RoomSelectModal } from "./RoomSelectModal.jsx";

const ROOM_MODAL_ID = "loginRoomSelectModal";

/**
 * LoginForm — "тупий" компонент.
 * onSuccess(login, room) — викликається з логіном і обраною кімнатою
 * після успішного входу, щоб одразу відкрити чат у потрібній кімнаті.
 *
 * Стать і колір нікнейма/повідомлень тепер обираються на формі
 * реєстрації (див. RegisterForm.jsx), а не тут — форма входу лише
 * автентифікує вже наявного користувача.
 *
 * Поля — Bootstrap Floating labels (.form-floating) зі стилем
 * .auth-input; кнопка — .auth-btn; лінки — .auth-link.
 *
 * Структура: .auth-stack (відступ 32px) → [.auth-fields (поля +
 * кнопка, відступ 16px), .auth-links].
 */
export function LoginForm({ onSuccess, onRegister, onForgot }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [room, setRoom] = useState(DEFAULT_ROOM);

  const { loading, error, login: doLogin, clearError } = useLoginStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    doLogin({ login, password }, () => onSuccess(login, room));
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        role="form"
        className="mx-auto text-center auth-form"
      >
        <div className="auth-stack">
          <div className="auth-fields">
            {error && <p className="text-danger text-center mb-0">{error}</p>}

            <div className="form-floating">
              <input
                id="loginInput"
                type="text"
                className="form-control auth-input"
                placeholder="Нікнейм"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
              />
              <label htmlFor="loginInput">Нікнейм</label>
            </div>

            {/* Глазик показати/сховати пароль — усередині інпута,
                справа (.input-with-toggle, див. _forms.css) — так
                само, як на формі реєстрації. */}
            <div className="form-floating input-with-toggle">
              <input
                id="passwordInput"
                type={showPassword ? "text" : "password"}
                className="form-control auth-input"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label htmlFor="passwordInput">Пароль</label>
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

            {/* readOnly-інпут з кімнатою за замовчуванням: клік (або
                Enter/Пробіл) відкриває RoomSelectModal, обрана кімната
                підставляється в інпут. form-select додає шеврон, а
                підпис "Кімната" завжди піднятий (значення є завжди). */}
            <div className="form-floating">
              <input
                id="roomInput"
                type="text"
                className="form-select auth-input room-select-input"
                value={
                  ROOMS_BY_ID[room]?.name ?? ROOMS_BY_ID[DEFAULT_ROOM].name
                }
                readOnly
                aria-haspopup="dialog"
                data-bs-toggle="modal"
                data-bs-target={`#${ROOM_MODAL_ID}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.currentTarget.click();
                  }
                }}
              />
              <label htmlFor="roomInput">Кімната</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary auth-btn"
            >
              {loading ? "Заходимо..." : "Увійти"}
            </button>
          </div>

          {/* Один ряд під кнопкою: "Немає акаунта? Зареєструватися"
              ліворуч, "Забули пароль?" праворуч. */}
          <div className="auth-links">
            <span className="auth-links-text">
              Немає акаунта?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onRegister();
                }}
                className="auth-link"
              >
                Зареєструватися
              </a>
            </span>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onForgot();
              }}
              className="auth-link"
            >
              Забули пароль?
            </a>
          </div>
        </div>
      </form>

      <RoomSelectModal
        modalId={ROOM_MODAL_ID}
        room={room}
        onConfirm={setRoom}
      />
    </>
  );
}