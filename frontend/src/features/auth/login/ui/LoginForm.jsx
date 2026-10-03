import { useState } from "react";
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
      <form
        onSubmit={handleSubmit}
        role="form"
        className="mx-auto text-center auth-form"
      >
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
          {/* readOnly-інпут з кімнатою за замовчуванням: клік (або
              Enter/Пробіл) відкриває RoomSelectModal, обрана кімната
              підставляється в інпут. form-select додає шеврон. */}
          <input
            id="roomInput"
            type="text"
            className="form-select room-select-input"
            value={ROOMS_BY_ID[room]?.name ?? ROOMS_BY_ID[DEFAULT_ROOM].name}
            readOnly
            aria-label="Кімната"
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
        </div>
        <div className="mb-5 d-grid gap-2">
          <button type="submit" disabled={loading} className="btn btn-primary">
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
        <footer>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onForgot();
            }}
            className="text-muted"
          >
            Забули пароль?
          </a>
        </footer>
      </form>

      <RoomSelectModal
        modalId={ROOM_MODAL_ID}
        room={room}
        onConfirm={setRoom}
      />
    </>
  );
}
