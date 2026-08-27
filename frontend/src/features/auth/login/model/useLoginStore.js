import { create } from "zustand";
import { loginRequest } from "@features/auth/login/api/login.api.js";
import { AuthSession } from "@shared/lib/authSession.js";

export const useLoginStore = create((set) => ({
  loading: false,
  error: null,

  login: async ({ login, password }, onSuccess) => {
    set({ loading: true, error: null });
    try {
      const data = await loginRequest({ login, password });
      // refreshToken/csrfToken пришли как cookie (см. axios.js/backend);
      // в теле ответа — только accessToken, он живёт в памяти вкладки.
      AuthSession.setAccessToken(data.accessToken);
      onSuccess();
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));