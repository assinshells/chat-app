import { useEffect, useState } from "react";
import { Storage } from "@shared/lib/storage.js";

const THEME_KEY = "appTheme";

export const THEMES = Object.freeze({
  LIGHT: "light",
  DARK: "dark",
});

export const applyTheme = (theme) => {
  const resolved = theme === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
  document.documentElement.setAttribute("data-bs-theme", resolved);
  Storage.set(THEME_KEY, resolved);
};

export const getStoredTheme = () => {
  const stored = Storage.get(THEME_KEY);
  if (stored === THEMES.DARK || stored === THEMES.LIGHT) return stored;

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? THEMES.DARK
    : THEMES.LIGHT;
};

export const initTheme = () => applyTheme(getStoredTheme());

const isDarkThemeApplied = () =>
  document.documentElement.getAttribute("data-bs-theme") === THEMES.DARK;

/**
 * useIsDarkTheme — реактивний прапорець поточної теми для компонентів,
 * яким колір/вигляд елемента залежить від теми (наприклад, палітра
 * кольорів у LoginForm.jsx: колір "чорний"/"білий" по-різному доречний
 * у світлій і темній темі). Тема застосовується атрибутом data-bs-theme
 * на <html> (applyTheme вище), тому підписуємось саме на його зміну
 * через MutationObserver — це покриває і перемикання теми з
 * SettingsModal, поки компонент лишається змонтованим.
 */
export const useIsDarkTheme = () => {
  const [isDark, setIsDark] = useState(isDarkThemeApplied);

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(isDarkThemeApplied()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-bs-theme"] });

    return () => observer.disconnect();
  }, []);

  return isDark;
};