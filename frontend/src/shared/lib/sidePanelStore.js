import { create } from "zustand";

/**
 * useSidePanelStore — права панель поруч із чатом. Кімнати й учасники
 * живуть у правому сайдбарі (див. rightSidebarStore), особисті, галерея
 * й налаштування — у модалках з іконок шапки, тож тут лишився один режим:
 * "userProfile" — профіль іншого користувача (див. userProfileLogin)
 * або null (панелі нема, чат на всю ширину).
 *
 * Окремий стор, а не useState у ChatLayout, бо відкрити профіль треба
 * з віддаленого місця — пункт "Профіль" біля ніка (DmTriggerButton).
 */
export const SIDE_PANELS = Object.freeze({
  USER_PROFILE: "userProfile",
});

export const useSidePanelStore = create((set) => ({
  panel: null,

  // Чий профіль показує панель "userProfile".
  userProfileLogin: null,

  openUserProfile: (login) =>
    set({ panel: SIDE_PANELS.USER_PROFILE, userProfileLogin: login }),

  close: () => set({ panel: null }),
}));
