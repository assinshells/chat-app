import { create } from "zustand";
import {
  completeRegistrationRequest,
  cancelRegistrationRequest,
} from "@features/auth/complete-registration/api/completeRegistration.api.js";
import { AuthSession } from "@shared/lib/authSession.js";

// Коди помилок бекенда, після яких продовжити цю реєстрацію неможливо —
// потрібно повернутися на сторінку входу й почати спочатку.
const FATAL_CODES = new Set(["REGISTRATION_SESSION_EXPIRED", "LOGIN_TAKEN"]);

export const useCompleteRegistrationStore = create((set, get) => ({
  loading: false,
  error: null,
  fatal: false, // true -> показуємо "Повернутися до входу" замість форми

  submit: async ({ email, noEmail, captchaToken }, onSuccess) => {
    // Захист від повторної відправки (подвійний клік, Enter + клік):
    // кнопка ще й disabled, але стор не покладається лише на UI.
    if (get().loading) return false;

    set({ loading: true, error: null });
    try {
      const data = await completeRegistrationRequest({
        email: noEmail ? null : email,
        noEmail,
        captchaToken: captchaToken || undefined,
      });
      // refreshToken/csrfToken прийшли як cookie; accessToken — лише в
      // пам'яті вкладки (так само, як при звичайному вході).
      AuthSession.setAccessToken(data.accessToken);
      onSuccess(data.login);
      return true;
    } catch (err) {
      set({ error: err.message, fatal: FATAL_CODES.has(err.code) });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // Помилка отримання/перевірки сесії при відкритті сторінки.
  markExpired: (message) => set({ error: message, fatal: true }),

  cancel: async () => {
    try {
      await cancelRegistrationRequest();
    } catch {
      // Сесія й так закінчиться за TTL — на навігацію не впливає.
    }
  },

  reset: () => set({ loading: false, error: null, fatal: false }),
  clearError: () => set({ error: null }),
}));
