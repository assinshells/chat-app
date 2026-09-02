import { useEffect, useRef } from "react";

const HIDE_DELAY = 900;

/**
 * useAutoHideScrollbar — імітує поведінку SimpleBar autoHide поверх
 * нативного скролу: під час скролу на елемент вішається клас
 * "is-scrolling" (див. CSS-правила .app-scrollbar.is-scrolling /
 * html.is-scrolling), який робить трек/повзунок видимим, а через
 * HIDE_DELAY мс без скролу клас знімається і скролбар знову ховається.
 * Наведення мишею показує скролбар незалежно від цього класу —
 * це вже чистий CSS (:hover), JS тут не потрібен.
 *
 * targetRef  — ref на елемент, що скролиться (overflow-y: auto/scroll).
 * options.window — true, якщо сам елемент не скролиться, а скролиться
 *                  документ цілком (наприклад AuthLayout) — тоді слухаємо
 *                  window, а клас вішаємо на <html>.
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
