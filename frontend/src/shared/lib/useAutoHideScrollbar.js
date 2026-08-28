import { useEffect, useRef } from "react";

const HIDE_DELAY = 900;

/**
 * useAutoHideScrollbar — имитирует поведение SimpleBar autoHide поверх
 * нативного скролла: во время скролла на элемент вешается класс
 * "is-scrolling" (см. CSS-правила .app-scrollbar.is-scrolling /
 * html.is-scrolling), который делает трек/бегунок видимым, а спустя
 * HIDE_DELAY мс без скролла класс снимается и скроллбар снова прячется.
 * Наведение мышью показывает скроллбар независимо от этого класса —
 * это уже чистый CSS (:hover), JS тут не нужен.
 *
 * targetRef  — ref на скроллящийся элемент (overflow-y: auto/scroll).
 * options.window — true, если сам элемент не скроллится, а скроллится
 *                  документ целиком (например AuthLayout) — тогда слушаем
 *                  window, а класс вешаем на <html>.
 */
export function useAutoHideScrollbar(targetRef, { window: isWindowScroll = false } = {}) {
  const timeoutRef = useRef(null);

  useEffect(() => {
    const scrollSource = isWindowScroll ? window : targetRef.current;
    const classTarget = isWindowScroll
      ? document.documentElement
      : targetRef.current;

    if (!scrollSource || !classTarget) return undefined;

    const handleScroll = () => {
      classTarget.classList.add("is-scrolling");

      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        classTarget.classList.remove("is-scrolling");
      }, HIDE_DELAY);
    };

    scrollSource.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollSource.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutRef.current);
      classTarget.classList.remove("is-scrolling");
    };
  }, [targetRef, isWindowScroll]);
}
