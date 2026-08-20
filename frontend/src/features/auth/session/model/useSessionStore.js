import { create } from "zustand";
import { fetchCurrentUser } from "@features/auth/session/api/session.api.js";

/**
 * useSessionStore — профиль текущего пользователя. Раньше вместо этого
 * App.jsx хранил в localStorage строку логина, введённую на форме —
 * ненадёжно (могла разойтись с реальной сессией) и, главное, не давало
 * userId, который нужен чату, чтобы отличать свои сообщения от чужих.
 * Теперь источник истины — сам backend (/api/auth/me), вызывается один
 * раз после логина/восстановления сессии по refresh-cookie.
 */
export const useSessionStore = create((set) => ({
  user: null,
  loading: false,

  loadCurrentUser: async () => {
    set({ loading: true });
    try {
      const user = await fetchCurrentUser();
      set({ user });
      return user;
    } finally {
      set({ loading: false });
    }
  },

  clear: () => set({ user: null }),
}));
