// 5 базовых цветов для настройки "цвет сообщений и ника" (см. настройки
// профиля). Значения (value) совпадают с backend COLOR_OPTIONS
// (users.color в БД) — меняются вместе, если понадобится добавить цвет.
//
// Красный сознательно не входит в набор: он уже зарезервирован в
// приложении под .nickname-own (свой ник / упоминание тебя, см. app.css)
// — добавление красного в выбор создало бы визуальный конфликт с этим
// индикатором.
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
 * getColorHex — hex-код для значения цвета из БД/сокета. Неизвестное или
 * отсутствующее значение (например, старое сообщение без поля color)
 * тихо откатывается на цвет по умолчанию, а не ломает рендер.
 */
export const getColorHex = (value) =>
  COLOR_HEX_BY_VALUE[value] ?? COLOR_HEX_BY_VALUE[DEFAULT_COLOR];
