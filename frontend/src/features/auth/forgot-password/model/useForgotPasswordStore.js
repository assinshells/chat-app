import { create } from "zustand";
import { forgotPasswordRequest } from "@features/auth/forgot-password/api/forgotPassword.api.js";

export const useForgotPasswordStore = create((set) => ({
  loading: false,
  error: null,

  submit: async ({ email }, onSuccess) => {
    set({ loading: true, error: null });
    try {
      await forgotPasswordRequest({ email });
      onSuccess();
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));