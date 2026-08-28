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