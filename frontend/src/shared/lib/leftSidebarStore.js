import { create } from "zustand";

/**
 * useLeftSidebarStore — яка вкладка лівого сайдбара зараз відкрита.
 *
 * Рейка (IconRail) працює як вертикальні pill-таби: кожна іконка —
 * це таб, що перемикає вміст сайдбара ("rooms" — список кімнат,
 * "users" — учасники кімнати). null — сайдбар згорнуто.
 *
 * На десктопі сайдбар відкритий одразу (вкладка "Кімнати"), на
 * телефоні — згорнутий і виїжджає поверх чату після кліку на іконку.
 */
export const LEFT_TABS = Object.freeze({
  ROOMS: "rooms",
  USERS: "users",
});

const isDesktop = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(min-width: 992px)").matches;

export const useLeftSidebarStore = create((set, get) => ({
  tab: isDesktop() ? LEFT_TABS.ROOMS : null,

  open: (tab) => set({ tab }),

  // Повторний клік по активній іконці згортає сайдбар.
  toggle: (tab) => set({ tab: get().tab === tab ? null : tab }),

  close: () => set({ tab: null }),
}));
