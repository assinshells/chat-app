import { useEffect, useState } from "react";
import { Storage } from "@shared/lib/storage.js";

const THEME_KEY = "appTheme";

export const THEMES = Object.freeze({
  LIGHT: "light",
  DARK: "dark",
  // "system" — не самостійна тема для DOM (Bootstrap розуміє лише
  // light/dark у data-bs-theme), а МЕТА-ВАРІАНТ вибору користувача:
  // "слідувати за темою ОС". Резолвиться в light/dark нижче.
  SYSTEM: "system",
});

const THEME_VALUES = Object.values(THEMES);

const getSystemTheme = () =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? THEMES.DARK
    : THEMES.LIGHT;

// Резолвить обраний варіант (light/dark/system) у конкретну тему,
// яку реально можна виставити в data-bs-theme.
const resolveTheme = (preference) => {
  if (preference === THEMES.SYSTEM) return getSystemTheme();
  return preference === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
};

// applyTheme зберігає ОБРАНИЙ ВАРІАНТ як є (у т.ч. "system") — це
// потрібно, щоб SettingsModal після перезавантаження сторінки міг
// показати активною саме "Системну", а не light/dark, у які вона
// того разу резолвилась.
export const applyTheme = (preference) => {
  const normalized = THEME_VALUES.includes(preference) ? preference : THEMES.SYSTEM;
  document.documentElement.setAttribute("data-bs-theme", resolveTheme(normalized));
  Storage.set(THEME_KEY, normalized);
};

// getStoredTheme повертає саме обраний варіант (light/dark/system),
// а не резолвлену тему. Якщо користувач ще ніколи не обирав тему
// явно — за замовчуванням це "system": застосунок одразу підлаштовується
// під ОС і продовжує стежити за її зміною (див. initTheme).
export const getStoredTheme = () => {
  const stored = Storage.get(THEME_KEY);
  if (THEME_VALUES.includes(stored)) return stored;

  return THEMES.SYSTEM;
};

export const initTheme = () => {
  applyTheme(getStoredTheme());

  // Поки обрано "Системну" тему, живо стежимо за prefers-color-scheme:
  // якщо користувач перемкне тему ОС (наприклад, за розкладом
  // "темна вночі"), інтерфейс підхопить це без перезавантаження сторінки.
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  media?.addEventListener("change", () => {
    if (getStoredTheme() === THEMES.SYSTEM) {
      document.documentElement.setAttribute("data-bs-theme", getSystemTheme());
    }
  });
};

const isDarkThemeApplied = () =>
  document.documentElement.getAttribute("data-bs-theme") === THEMES.DARK;

/**
 * useIsDarkTheme — реактивний прапорець поточної теми для компонентів,
 * яким колір/вигляд елемента залежить від теми (наприклад, палітра
 * кольорів у RegisterForm.jsx: колір "чорний"/"білий" по-різному доречний
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