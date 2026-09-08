import { create } from "zustand";
import { loginRequest } from "@features/auth/login/api/login.api.js";
import {
  updateGenderRequest,
  updateColorRequest,
} from "@features/settings/api/settings.api.js";
import { AuthSession } from "@shared/lib/authSession.js";

export const useLoginStore = create((set) => ({
  loading: false,
  error: null,

  login: async ({ login, password, gender, color }, onSuccess) => {
    set({ loading: true, error: null });
    try {
      const data = await loginRequest({ login, password });
      // refreshToken/csrfToken прийшли як cookie (див. axios.js/backend);
      // у тілі відповіді — лише accessToken, він живе в пам'яті вкладки.
      AuthSession.setAccessToken(data.accessToken);

      // Стать і колір тепер обираються прямо на формі входу (див.
      // LoginForm.jsx), а не на реєстрації — щойно accessToken у пам'яті,
      // можна викликати авторизовані PATCH-запити і зберегти вибір
      // на акаунті. Якщо це не перший вхід, вони просто перезапишуть
      // те саме значення, що вже стоїть — не критично.
      await Promise.all([
        updateGenderRequest(gender),
        updateColorRequest(color),
      ]);

      onSuccess();
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
