import { Circle, Moon, CircleMinus, BellOff } from "lucide-react";

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
  { value: STATUS_VALUES.ONLINE, icon: Circle, tone: "online", label: "На зв'язку" },
  { value: STATUS_VALUES.AWAY, icon: Moon, tone: "away", label: "Відійшов" },
  { value: STATUS_VALUES.BUSY, icon: CircleMinus, tone: "busy", label: "Зайнятий" },
  { value: STATUS_VALUES.DND, icon: BellOff, tone: "dnd", label: "Не турбувати" },
]);

const STATUS_BY_VALUE = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option]),
);

/**
 * getStatusOption — опція статусу (icon/tone/label) для значення з БД/сокета.
 * Невідоме значення тихо відкочується на статус за замовчуванням.
 */
export const getStatusOption = (value) =>
  STATUS_BY_VALUE[value] ?? STATUS_BY_VALUE[DEFAULT_STATUS];

export const getStatusLabel = (value) =>
  (STATUS_BY_VALUE[value] ?? STATUS_BY_VALUE[DEFAULT_STATUS]).label;
