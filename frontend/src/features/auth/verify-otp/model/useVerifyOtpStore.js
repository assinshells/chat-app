import { create } from "zustand";
import { verifyOtpRequest } from "@features/auth/verify-otp/api/verifyOtp.api.js";
import { forgotPasswordRequest } from "@features/auth/forgot-password/api/forgotPassword.api.js";

export const useVerifyOtpStore = create((set) => ({
  loading: false,
  resending: false,
  error: null,
  info: null,

  verify: async ({ email, otpCode }, onSuccess) => {
    set({ loading: true, error: null, info: null });
    try {
      const data = await verifyOtpRequest({ email, otpCode });
      onSuccess(data.verifiedToken);
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  // Повторна відправка коду: бекенд генерує новий OTP (старий перестає
  // діяти) і скидає лічильник невдалих спроб.
  resend: async ({ email }, onSuccess) => {
    set({ resending: true, error: null, info: null });
    try {
      await forgotPasswordRequest({ email });
      set({ info: "Новий код надіслано." });
      onSuccess?.();
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ resending: false });
    }
  },

  clearError: () => set({ error: null }),
}));
