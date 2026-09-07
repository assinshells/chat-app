import { ROLE_VALUES } from "./auth.constants.js";

export const MODERATION_ACTIONS = Object.freeze({
  KICK: "kick",
  BAN: "ban",
  UNBAN: "unban",
});

// Ролі, яким доступні самі HTTP-роути кіку/бану (routes/moderationAction.routes.js).
// На відміну від керування ролями (ROLE_MANAGER_ROLES — лише admin/superadmin),
// сюди входить і 'moderator' — саме модератори повсякденно кикають/банять
// у своїх кімнатах; що саме їм дозволено — вирішує вже
// services/moderationAction.service.js (перелік moderatorRooms, заборона
// глобальних дій).
export const MODERATION_ACTOR_ROLES = Object.freeze([
  ROLE_VALUES.MODERATOR,
  ROLE_VALUES.ADMIN,
  ROLE_VALUES.SUPERADMIN,
]);

// Пресети тривалості бану для UI-селекта. Кастомна тривалість також
// підтримується API (durationMs — довільне число мілісекунд) —
// пресети лише зручні готові значення, не єдиний дозволений набір.
export const BAN_DURATION_PRESETS = Object.freeze([
  { value: "15m", ms: 15 * 60 * 1000, label: "15 хвилин" },
  { value: "1h", ms: 60 * 60 * 1000, label: "1 година" },
  { value: "1d", ms: 24 * 60 * 60 * 1000, label: "1 день" },
  { value: "7d", ms: 7 * 24 * 60 * 60 * 1000, label: "7 днів" },
  { value: "permanent", ms: null, label: "Назавжди" },
]);

// Пресети тривалості КІКУ (=скільки триває замкнення в KICK_CONFINEMENT_ROOM,
// див. constants/chat.constants.js). На відміну від бану — без "назавжди"
// (для цього є бан) і в набагато коротшому масштабі: кік — це "охолонути",
// а не покарання на дні/тижні.
export const KICK_DURATION_PRESETS = Object.freeze([
  { value: "2m", ms: 2 * 60 * 1000, label: "2 хвилини" },
  { value: "5m", ms: 5 * 60 * 1000, label: "5 хвилин" },
  { value: "15m", ms: 15 * 60 * 1000, label: "15 хвилин" },
  { value: "1h", ms: 60 * 60 * 1000, label: "1 година" },
]);

export const MODERATION_ERRORS = Object.freeze({
  FORBIDDEN: "Недостатньо прав для цієї дії",
  CANNOT_TARGET_SELF: "Не можна застосувати цю дію до себе",
  CANNOT_TARGET_SUPERADMIN: "Не можна застосувати цю дію до суперадміністратора",
  ADMIN_ONLY_SUPERADMIN: "Лише суперадміністратор може карати адміністратора",
  NOT_MODERATED_ROOM: "Ви не модеруєте цю кімнату",
  GLOBAL_FORBIDDEN_FOR_MODERATOR: "Модератор не може видавати глобальний бан",
  ROOM_REQUIRED: "Потрібно вказати кімнату",
  ROOM_INVALID: "Невідома кімната",
  DURATION_INVALID: "Невірна тривалість бану",
  DURATION_REQUIRED: "Потрібно вказати тривалість кіку",
  BAN_NOT_FOUND: "Активний бан не знайдено",

  // Показуються самому забаненому/кікнутому користувачу на фронті.
  BANNED_GLOBAL: "Вас заблоковано в чаті",
  BANNED_ROOM: "Вас заблоковано в цій кімнаті",
  CONFINED: "Ви тимчасово обмежені однією кімнатою",
});
