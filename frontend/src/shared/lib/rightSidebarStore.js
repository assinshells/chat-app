import { create } from "zustand";

/**
 * useRightSidebarStore — стан правого сайдбара (кімнати і користувачі).
 *
 *  - tab: активна вкладка — "rooms" (кімнати) або "users" (користувачі);
 *  - mobileOpen: на телефоні (< 992px) сайдбар схований і висувається
 *    поверх чату за іконкою в шапці; на десктопі прапорець ні на що не
 *    впливає (сайдбар завжди видно).
 */
export const SIDEBAR_TABS = Object.freeze({
  ROOMS: "rooms",
  USERS: "users",
});

export const useRightSidebarStore = create((set) => ({
  tab: SIDEBAR_TABS.ROOMS,
  mobileOpen: false,

  setTab: (tab) => set({ tab }),
  toggleMobile: () => set((state) => ({ mobileOpen: !state.mobileOpen })),
  closeMobile: () => set({ mobileOpen: false }),
}));
