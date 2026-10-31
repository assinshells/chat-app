import { create } from "zustand";
import { loginRequest } from "@features/auth/login/api/login.api.js";
import { AuthSession } from "@shared/lib/authSession.js";

const STATUS_AUTHENTICATED = "authenticated";
const STATUS_REGISTRATION_REQUIRED = "registration_required";

export const useLoginStore = create((set, get) => ({
  loading: false,
  error: null,

  /**
   * Результат визначає сервер:
   *  - authenticated          -> onSuccess() (вхід у чат);
   *  - registration_required  -> onRegistrationRequired() (логіна немає:
   *    переходимо до завершення реєстрації);
   *  - помилка (хибний пароль, ліміт спроб, валідація) -> error.
   */
  login: async ({ login, password }, { onSuccess, onRegistrationRequired }) => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const data = await loginRequest({ login, password });

      if (data.status === STATUS_REGISTRATION_REQUIRED) {
        onRegistrationRequired();
        return;
      }

      if (data.status === STATUS_AUTHENTICATED) {
        // refreshToken/csrfToken прийшли як cookie (див. axios.js/backend);
        // у тілі відповіді — лише accessToken, він живе в пам'яті вкладки.
        AuthSession.setAccessToken(data.accessToken);
        onSuccess();
        return;
      }

      set({ error: "Неочікувана відповідь сервера" });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
