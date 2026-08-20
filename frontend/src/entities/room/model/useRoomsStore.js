import { create } from "zustand";
import { fetchRooms } from "@entities/room/api/room.api.js";

/**
 * useRoomsStore — список комнат (статический на бэкенде, см.
 * backend/src/constants/rooms.data.js) и id выбранной комнаты.
 *
 * activeRoomId нарочно НЕ выбирается автоматически после загрузки
 * списка — по требованию вход в чат должен показывать пустое
 * состояние с предложением выбрать комнату, а не сразу открывать
 * первую попавшуюся.
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
