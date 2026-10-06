import { create } from "zustand";
import { clearImageCache } from "@shared/api/image.api.js";
import { clearGalleryCache } from "@shared/api/gallery.api.js";
import { logoutRequest } from "@features/auth/logout/api/logout.api.js";
import { AuthSession } from "@shared/lib/authSession.js";
import { useDmStore } from "@features/dm/model/useDmStore.js";
import { useBlockStore } from "@features/block/model/useBlockStore.js";

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
      // useDmStore/useBlockStore — singleton-стори на рівні модуля, живуть
      // довше за ChatLayout: без явного скидання тут діалоги/лічильники/
      // список заблокованих поточного акаунта лишалися б у пам'яті і
      // потрапили б у сесію наступного логіну в цій самій вкладці (див.
      // детальний коментар у setCurrentUser/reset в useDmStore.js).
      useDmStore.getState().reset();
      clearImageCache();
      clearGalleryCache();
      useBlockStore.getState().reset();
      set({ loading: false });
      onSuccess();
    }
  },
}));