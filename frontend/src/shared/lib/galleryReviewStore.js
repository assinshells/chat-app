import { create } from "zustand";

import { fetchReviewGallery } from "@shared/api/gallery.api.js";

/**
 * useGalleryReviewStore — скільки фото чекає перевірки (бейдж на іконці
 * галереї в шапці; лише для тих, хто перевіряє). Джерело — відповідь
 * GET /api/gallery/review (pendingCount); оновлюється при відкритті/закритті
 * галереї та точково після схвалення/видалення (adjust).
 */
export const useGalleryReviewStore = create((set) => ({
  pendingCount: 0,

  setPendingCount: (pendingCount) => set({ pendingCount }),

  adjust: (delta) =>
    set((state) => ({ pendingCount: Math.max(0, state.pendingCount + delta) })),

  refresh: async () => {
    try {
      const data = await fetchReviewGallery({ limit: 1 });
      set({ pendingCount: data.pendingCount });
    } catch {
      // Немає права/з'єднання — бейдж просто не оновлюємо.
    }
  },
}));
