import { create } from "zustand";

/**
 * useRightSidebarStore — активна вкладка правого сайдбара (кімнати і
 * користувачі): "all" — обидва списки разом (30/70), "rooms" — лише
 * кімнати, "users" — лише користувачі. Окремий стор, бо той самий вміст
 * показується в правому сайдбарі (десктоп) і у вкладці "Чати" лівої
 * рейки (телефон) — вибір вкладки не має губитись при перемиканні.
 */
export const SIDEBAR_TABS = Object.freeze({
  ALL: "all",
  ROOMS: "rooms",
  USERS: "users",
});

export const useRightSidebarStore = create((set) => ({
  tab: SIDEBAR_TABS.ALL,
  setTab: (tab) => set({ tab }),
}));
