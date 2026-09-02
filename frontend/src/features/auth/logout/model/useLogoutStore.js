import { create } from "zustand";
import { logoutRequest } from "@features/auth/logout/api/logout.api.js";
import { AuthSession } from "@shared/lib/authSession.js";

export const useLogoutStore = create((set) => ({
  loading: false,

  logout: async (onSuccess) => {
    set({ loading: true });
    try {
      await logoutRequest();
    } catch {
      // Ігноруємо — refresh-токен може бути вже прострочений/відкликаний
    } finally {
      AuthSession.clear();
      set({ loading: false });
      onSuccess();
    }
  },
}));