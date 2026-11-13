import { create } from "zustand";

/**
 * useAppModalStore — які split-модалки відкриті з шапки: налаштування і
 * фотогалерея. (Особисті повідомлення мають свій стор — useDmStore, бо
 * там ще й діалоги.) Одночасно відкрита лише одна з двох.
 */
export const useAppModalStore = create((set) => ({
  settingsOpen: false,
  galleryOpen: false,

  openSettings: () => set({ settingsOpen: true, galleryOpen: false }),
  closeSettings: () => set({ settingsOpen: false }),

  openGallery: () => set({ galleryOpen: true, settingsOpen: false }),
  closeGallery: () => set({ galleryOpen: false }),
}));
