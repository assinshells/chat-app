import { useEffect, useState } from "react";
import { useLoginStore } from "@features/auth/login/model/useLoginStore.js";
import { useRoomsStore } from "@entities/room";

// Комната по умолчанию — совпадает с id "Головної" кімнати на бекенді
// (backend/src/constants/rooms.data.js). Якщо список кімнат ще не
// встиг завантажитись до сабміту форми, юзер однаково потрапить сюди.
const DEFAULT_ROOM_ID = "general";
const DEFAULT_ROOM_NAME = "Головна";

/**
 * LoginForm — тупой компонент.
 * onSuccess(login) — вызывается с логином после успешного входа.
 *
 * Список кімнат підвантажується тут же (useRoomsStore.loadRooms), щоб
 * користувач міг одразу обрати кімнату, в яку потрапить після входу —
 * без цього довелось би відкривати панель "Кімнати" вже всередині
 * чату. Обраний roomId записується в useRoomsStore.activeRoomId ще до
 * виклику onSuccess, тож ChatPage після навігації одразу відкриє
 * потрібну кімнату.
 */
export function LoginForm({ onSuccess, onRegister, onForgot }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  // Пустое значення = плейсхолдер "Виберіть кімнату" ще не змінили
  // юзером. Якщо так і відправлять форму — підставляємо кімнату за
  // замовчуванням (DEFAULT_ROOM_ID), сам плейсхолдер кімнатою не є.
  const [roomId, setRoomId] = useState("");
  const { loading, error, login: doLogin, clearError } = useLoginStore();

  const rooms = useRoomsStore((s) => s.rooms);
  const roomsLoading = useRoomsStore((s) => s.loading);
  const loadRooms = useRoomsStore((s) => s.loadRooms);
  const selectRoom = useRoomsStore((s) => s.selectRoom);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();
    doLogin({ login, password }, () => {
      selectRoom(roomId || DEFAULT_ROOM_ID);
      onSuccess(login);
    });
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
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={roomsLoading && rooms.length === 0}
          >
            <option value="" disabled hidden>
              Виберіть кімнату
            </option>
            {rooms.length === 0 ? (
              <option value={DEFAULT_ROOM_ID}>{DEFAULT_ROOM_NAME}</option>
            ) : (
              rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))
            )}
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