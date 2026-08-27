import { create } from "zustand";
import { resetPasswordRequest } from "@features/auth/reset-password/api/resetPassword.api.js";

export const useResetPasswordStore = create((set) => ({
  loading: false,
  error: null,

  reset: async ({ verifiedToken, password, confirmPassword }, onSuccess) => {
    set({ loading: true, error: null });
    try {
      await resetPasswordRequest({ verifiedToken, password, confirmPassword });
      onSuccess();
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));