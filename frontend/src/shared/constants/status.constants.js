// Статус доступності користувача (таб "Налаштування" -> вибір,
// таб "Профіль" -> показ з емодзі, список "Онлайн" -> той самий
// емодзі біля ніка). Значення (value) точно збігаються з backend
// STATUS_VALUES (constants/auth.constants.js, CHECK-обмеження
// users_status_check у docker/postgres/init.sql) — усі три місця
// змінюються разом.
export const STATUS_VALUES = Object.freeze({
  ONLINE: "online",
  AWAY: "away",
  BUSY: "busy",
  DND: "dnd",
});

export const DEFAULT_STATUS = STATUS_VALUES.ONLINE;

// Порядок — від "найбільш доступний" до "найменш доступний", саме в
// такому порядку статуси показуються в табі "Налаштування".
export const STATUS_OPTIONS = Object.freeze([
  { value: STATUS_VALUES.ONLINE, emoji: "🟢", label: "На зв'язку" },
  { value: STATUS_VALUES.AWAY, emoji: "🌙", label: "Відійшов" },
  { value: STATUS_VALUES.BUSY, emoji: "⛔", label: "Зайнятий" },
  { value: STATUS_VALUES.DND, emoji: "🔕", label: "Не турбувати" },
]);

const STATUS_BY_VALUE = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option]),
);

/**
 * getStatusEmoji — емодзі для значення статусу з БД/сокета. Невідоме
 * або відсутнє значення (наприклад, presence-запис зі старого сокета
 * без поля status) тихо відкочується на статус за замовчуванням, а не
 * ламає рендер — той самий принцип, що й getColorHex у color.constants.js.
 */
export const getStatusEmoji = (value) =>
  (STATUS_BY_VALUE[value] ?? STATUS_BY_VALUE[DEFAULT_STATUS]).emoji;

export const getStatusLabel = (value) =>
  (STATUS_BY_VALUE[value] ?? STATUS_BY_VALUE[DEFAULT_STATUS]).label;
