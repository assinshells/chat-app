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
      // Игнорируем — refresh-токен может быть уже истекшим/отозванным
    } finally {
      AuthSession.clear();
      set({ loading: false });
      onSuccess();
    }
  },
}));