import { create } from "zustand";

/**
 * useSidePanelStore — права панель поруч із чатом. Кімнати, учасники,
 * особисті, галерея, профіль і налаштування переїхали у вкладки лівої
 * рейки (див. leftSidebarStore), тож тут лишився один режим:
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
