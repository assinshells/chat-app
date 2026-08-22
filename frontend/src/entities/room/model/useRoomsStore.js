import { create } from "zustand";
import { fetchRooms } from "@entities/room/api/room.api.js";

/**
 * useRoomsStore — список комнат (статический на бэкенде, см.
 * backend/src/constants/rooms.data.js) и id выбранной комнаты.
 *
 * loadRooms сам по себе НЕ выбирает activeRoomId — по умолчанию вход в
 * чат (например, после обновления страницы / silent-refresh сессии)
 * показывает пустое состояние с предложением выбрать комнату, а не
 * сразу открывает первую попавшуюся. Исключение — обычный вход через
 * форму логина: там activeRoomId выставляется явным selectRoom() до
 * навигации в чат (см. features/auth/login/ui/LoginForm.jsx), поэтому
 * после логина пользователь сразу попадает в выбранную (по умолчанию —
 * "Головна") комнату.
 */
export const useRoomsStore = create((set) => ({
  rooms: [],
  loading: false,
  error: null,
  activeRoomId: null,
  // { [roomId]: count } — сколько пользователей сейчас в комнате.
  // Приходит по Socket.IO (см. SOCKET_EVENTS.ROOM_USER_COUNTS,
  // подписка в widgets/room-list/ui/RoomList.jsx), а не REST'ом —
  // счётчик живой и должен обновляться в реальном времени.
  userCounts: {},

  loadRooms: async () => {
    set({ loading: true, error: null });
    try {
      const rooms = await fetchRooms();
      set({ rooms });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  selectRoom: (roomId) => set({ activeRoomId: roomId }),

  setUserCounts: (userCounts) => set({ userCounts }),

  reset: () =>
    set({ rooms: [], loading: false, error: null, activeRoomId: null, userCounts: {} }),
}));
