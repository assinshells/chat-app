import { ROLE_VALUES } from "@shared/constants/role.constants.js";

// Значення (value) точно збігаються з тим, що приймає backend
// (durationMs обчислюється тут з ms і надсилається як число, самі
// value/ms — лише зручність для UI, бекенд приймає будь-який durationMs
// в розумних межах, а не лише ці пресети).
export const BAN_DURATION_PRESETS = Object.freeze([
  { value: "15m", ms: 15 * 60 * 1000, label: "15 хвилин" },
  { value: "1h", ms: 60 * 60 * 1000, label: "1 година" },
  { value: "1d", ms: 24 * 60 * 60 * 1000, label: "1 день" },
  { value: "7d", ms: 7 * 24 * 60 * 60 * 1000, label: "7 днів" },
  { value: "permanent", ms: null, label: "Назавжди" },
]);

// Кік тепер — тимчасове замкнення в одній кімнаті (bespredel), а не
// "виштовхнути і одразу можна повернутися" — тому теж потребує
// тривалості, але в набагато коротшому масштабі за бан і без "назавжди"
// (для цього є бан).
export const KICK_DURATION_PRESETS = Object.freeze([
  { value: "2m", ms: 2 * 60 * 1000, label: "2 хвилини" },
  { value: "5m", ms: 5 * 60 * 1000, label: "5 хвилин" },
  { value: "15m", ms: 15 * 60 * 1000, label: "15 хвилин" },
  { value: "1h", ms: 60 * 60 * 1000, label: "1 година" },
]);

/**
 * canModerateRoom — чи може користувач з роллю `role` (і, для
 * модератора, переліком moderatorRooms — див. useCurrentUserStore)
 * кикати/банити в конкретній `room`. Дзеркалить перевірку в
 * backend/src/services/moderationAction.service.js assertCanAct —
 * тут вона потрібна лише для видимості кнопок у меню (реальна
 * перевірка все одно на бекенді).
 */
export function canModerateRoom(role, moderatorRooms, room) {
  if (role === ROLE_VALUES.ADMIN || role === ROLE_VALUES.SUPERADMIN) return true;
  if (role === ROLE_VALUES.MODERATOR) return (moderatorRooms ?? []).includes(room);
  return false;
}

/** canBanGlobally — лише admin/superadmin можуть видавати глобальний бан. */
export function canBanGlobally(role) {
  return role === ROLE_VALUES.ADMIN || role === ROLE_VALUES.SUPERADMIN;
}
