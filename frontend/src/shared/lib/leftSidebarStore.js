import { create } from "zustand";

/**
 * useLeftSidebarStore — навігація застосунку: яка вкладка рейки (IconRail)
 * активна, який підтаб у "Чатах" і чи відкритий чат на телефоні.
 *
 * Рейка — вертикальна по центру зліва на десктопі і горизонтальна
 * внизу на телефоні. Сайдбар поруч показує вміст активної вкладки.
 */
export const LEFT_TABS = Object.freeze({
  CHATS: "chats",
  USERS: "users",
  GALLERY: "gallery",
  NOTIFICATIONS: "notifications",
  PROFILE: "profile",
  SETTINGS: "settings",
});

// Підтаби вкладки "Чати": усе разом (кімнати зверху, діалоги знизу),
// лише кімнати, лише особисті.
export const CHAT_FILTERS = Object.freeze({
  ALL: "all",
  ROOMS: "rooms",
  DIALOGS: "dialogs",
});

export const useLeftSidebarStore = create((set) => ({
  activeTab: LEFT_TABS.CHATS,
  chatsFilter: CHAT_FILTERS.ALL,

  // Телефон: true — на весь екран відкритий чат (кімната або діалог),
  // рейка і списки сховані; false — показано список з рейкою внизу.
  // На десктопі прапорець ні на що не впливає.
  chatOpen: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setChatsFilter: (filter) => set({ chatsFilter: filter }),
  openChat: () => set({ chatOpen: true }),
  closeChat: () => set({ chatOpen: false }),
}));
