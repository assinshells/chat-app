import { create } from "zustand";
import { logoutRequest } from "@features/auth/logout/api/logout.api.js";
import { AuthSession } from "@shared/lib/authSession.js";
import { useDmStore } from "@features/dm/model/useDmStore.js";

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
      // useDmStore — singleton на рівні модуля, живе довше за ChatLayout:
      // без явного скидання тут діалоги/лічильники поточного акаунта
      // лишалися б у пам'яті і потрапили б у сесію наступного логіну в
      // цій самій вкладці (див. детальний коментар у setCurrentUser/reset
      // в useDmStore.js).
      useDmStore.getState().reset();
      set({ loading: false });
      onSuccess();
    }
  },
}));