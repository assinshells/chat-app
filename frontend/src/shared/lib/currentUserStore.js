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
  moderatorRooms: [],

  setUser: (user) =>
    set({
      id: user.id,
      login: user.login,
      role: user.role,
      moderatorRooms: user.moderatorRooms ?? [],
    }),

  clear: () => set({ id: null, login: null, role: null, moderatorRooms: [] }),
}));
