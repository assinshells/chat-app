// 5 базових кольорів для налаштування "колір повідомлень і ніка" (див.
// налаштування профілю). Значення (value) збігаються з backend COLOR_OPTIONS
// (users.color в БД) — змінюються разом, якщо знадобиться додати колір.
//
// Червоний свідомо не входить у набір: він вже зарезервований у
// застосунку під .nickname-own (свій нік / згадка тебе, див. app.css)
// — додавання червоного до вибору створило б візуальний конфлікт з цим
// індикатором.
export const COLOR_OPTIONS = Object.freeze([
  { value: "black", hex: "#1a1a1a", label: "Чорний" },
  { value: "blue", hex: "#0d6efd", label: "Синій" },
  { value: "green", hex: "#198754", label: "Зелений" },
  { value: "purple", hex: "#6f42c1", label: "Фіолетовий" },
  { value: "orange", hex: "#fd7e14", label: "Помаранчевий" },
]);

export const DEFAULT_COLOR = "black";

const COLOR_HEX_BY_VALUE = Object.fromEntries(
  COLOR_OPTIONS.map((option) => [option.value, option.hex]),
);

/**
 * getColorHex — hex-код для значення кольору з БД/сокета. Невідоме або
 * відсутнє значення (наприклад, старе повідомлення без поля color)
 * тихо відкочується на колір за замовчуванням, а не ламає рендер.
 */
export const getColorHex = (value) =>
  COLOR_HEX_BY_VALUE[value] ?? COLOR_HEX_BY_VALUE[DEFAULT_COLOR];
