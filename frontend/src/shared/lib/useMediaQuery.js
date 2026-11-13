import { useSyncExternalStore } from "react";

/**
 * useMediaQuery — підписка на CSS media query (напр. "(min-width: 768px)").
 * Повертає false там, де matchMedia недоступний.
 */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia?.(query);
      mql?.addEventListener("change", onChange);
      return () => mql?.removeEventListener("change", onChange);
    },
    () => window.matchMedia?.(query).matches ?? false,
    () => false,
  );
}
