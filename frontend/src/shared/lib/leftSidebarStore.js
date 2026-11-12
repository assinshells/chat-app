import { create } from "zustand";

/**
 * useLeftSidebarStore — яка вкладка лівої рейки (IconRail) зараз активна.
 *
 * Ліва рейка і лівий сайдбар — окремий від правої панелі (useSidePanelStore)
 * блок навігації: рейка містить іконки-таби, а сайдбар поруч показує
 * вміст активної вкладки.
 */
export const LEFT_TABS = Object.freeze({
  HOME: "home",
  CHATS: "chats",
  FAVORITES: "favorites",
  NOTIFICATIONS: "notifications",
  SETTINGS: "settings",
});

export const useLeftSidebarStore = create((set) => ({
  activeTab: LEFT_TABS.HOME,

  setActiveTab: (tab) => set({ activeTab: tab }),
}));
