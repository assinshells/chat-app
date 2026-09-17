import { create } from "zustand";

/**
 * useCurrentUserStore — профіль поточного залогіненого користувача,
 * одержаний з GET /api/auth/me (див. shared/api/me.api.js). Потрібен,
 * щоб UI знав власну роль — access-токен навмисно не несе роль (вона
 * може змінитися до сплину токена, див. backend guards/role.guard.js),
 * тому це єдине джерело правди на фронті.
 *
 * Заповнюється в App.jsx одразу після успішного login/refresh,
 * очищується при logout. Singleton-стор на рівні модуля (як useDmStore) —
 * компоненти на кшталт DmTriggerButton читають його напряму, без
 * прокидання пропсів через увесь ланцюжок ChatLayout -> Sidebar.
 */
export const useCurrentUserStore = create((set) => ({
  id: null,
  login: null,
  role: null,
  status: null,
  email: null,
  city: null,
  displayName: null,
  moderatorRooms: [],

  setUser: (user) =>
    set({
      id: user.id,
      login: user.login,
      role: user.role,
      status: user.status,
      email: user.email ?? null,
      city: user.city ?? null,
      displayName: user.displayName ?? null,
      moderatorRooms: user.moderatorRooms ?? [],
    }),

  // Оптимістичне оновлення одразу після успішного status:update (див.
  // useChatSocket.js) — не чекаємо наступного getMe, щоб таб "Профіль"
  // відреагував миттєво.
  setStatus: (status) => set({ status }),

  // Точкове оновлення email/city/displayName після успішного
  // PATCH-запиту з EditableProfileField (аккордеон "Personal Info" в
  // ChatLeftSidebar, таб "Профіль") — так само без повторного getMe.
  setEmail: (email) => set({ email }),
  setCity: (city) => set({ city }),
  setDisplayName: (displayName) => set({ displayName }),

  clear: () =>
    set({
      id: null,
      login: null,
      role: null,
      status: null,
      email: null,
      city: null,
      displayName: null,
      moderatorRooms: [],
    }),
}));
