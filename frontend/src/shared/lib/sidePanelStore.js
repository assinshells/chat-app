import { create } from "zustand";

/**
 * useSidePanelStore — яка саме права панель зараз відкрита в чаті.
 *
 * Одночасно відкрита максимум одна: "users" (учасники кімнати),
 * "dm" (особисті повідомлення), "profile" (профіль і налаштування)
 * або null (панелі нема, чат на всю ширину). Окремий стор, а не
 * useState у ChatLayout, бо відкрити панель треба і з віддалених
 * місць — наприклад, пункт "Написати особисте повідомлення" біля
 * ніка (DmTriggerButton) відкриває панель "dm" без прокидання пропів.
 */
export const SIDE_PANELS = Object.freeze({
  USERS: "users",
  DM: "dm",
  PROFILE: "profile",
});

export const useSidePanelStore = create((set, get) => ({
  panel: null,

  open: (panel) => set({ panel }),

  // Повторний клік по тій самій кнопці в шапці закриває панель.
  toggle: (panel) => set({ panel: get().panel === panel ? null : panel }),

  close: () => set({ panel: null }),
}));
