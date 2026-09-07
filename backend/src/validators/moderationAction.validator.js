import { ValidationException } from "../exceptions/auth.exceptions.js";
import { ROOM_IDS } from "../constants/chat.constants.js";
import { MAX_KICK_CHAT_DURATION_MS } from "../constants/moderationAction.constants.js";

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

// Верхня межа для "тимчасового" бану — трохи більше року. Захист від
// абсурдних значень з клієнта (durationMs — довільне число мс, а не
// один із фіксованих пресетів, див. constants/moderationAction.constants.js
// BAN_DURATION_PRESETS — це підказка для UI, а не єдиний дозволений набір).
const MAX_BAN_DURATION_MS = 366 * 24 * 60 * 60 * 1000;

// Кік ("в беспредел") — це "охолонути", а не покарання на дні: верхня
// межа набагато нижча за бан і, на відміну від нього, durationMs
// ОБОВ'ЯЗКОВИЙ — "кік назавжди" не існує (для цього є бан). Реальне
// значення для actorRole === 'moderator' все одно перезаписується
// сервісом (resolveDurationMs) — ця межа лише захищає значення, яке
// admin/superadmin можуть надіслати самі.
const MAX_KICK_DURATION_MS = 24 * 60 * 60 * 1000;

// Верхня межа для явно переданого з клієнта durationMs; body.durationMs
// може бути відсутнім (undefined) — тоді сервіс сам підставить дефолт
// (10 хв), і ця перевірка просто пропускається.
const isValidOptionalDurationMs = (raw, max) => {
  if (raw === null || raw === undefined) return true;
  const ms = Number(raw);
  return Number.isFinite(ms) && ms > 0 && ms <= max;
};

export const validateKickRequest = (body) => {
  const errors = [];
  if (!isNonEmptyString(body.login)) errors.push("логін обов'язковий");
  if (!ROOM_IDS.includes(body.room)) errors.push("невідома кімната");

  if (!isValidOptionalDurationMs(body.durationMs, MAX_KICK_DURATION_MS)) {
    errors.push("невірна тривалість кіку");
  }

  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

/**
 * validateKickChatRequest — "кикнути з чату". На відміну від
 * validateKickRequest, room не потрібен (дія не прив'язана до
 * конкретної кімнати), а durationMs НЕОБОВ'ЯЗКОВИЙ у запиті (може бути
 * відсутнім — тоді дефолт 10 хв підставить сервіс).
 */
export const validateKickChatRequest = (body) => {
  const errors = [];
  if (!isNonEmptyString(body.login)) errors.push("логін обов'язковий");

  if (!isValidOptionalDurationMs(body.durationMs, MAX_KICK_CHAT_DURATION_MS)) {
    errors.push("невірна тривалість кіку з чату");
  }

  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

/**
 * validateBanRoomRequest — "бан кімнати". room теж не приймається з
 * клієнта (перелік кімнат для бану сервіс визначає сам за правами
 * актора) — це саме те, що відрізняє її від validateBanRequest.
 * durationMs === null дозволений явно (означає "назавжди") — на
 * відміну від undefined/absent, яке теж валідне (дефолт 10 хв).
 */
export const validateBanRoomRequest = (body) => {
  const errors = [];
  if (!isNonEmptyString(body.login)) errors.push("логін обов'язковий");

  if (body.durationMs !== null && !isValidOptionalDurationMs(body.durationMs, MAX_BAN_DURATION_MS)) {
    errors.push("невірна тривалість бану кімнати");
  }

  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

export const validateBanRequest = (body) => {
  const errors = [];
  if (!isNonEmptyString(body.login)) errors.push("логін обов'язковий");

  if (body.scope !== "room" && body.scope !== "global") {
    errors.push("область дії має бути 'room' або 'global'");
  } else if (body.scope === "room" && !ROOM_IDS.includes(body.room)) {
    errors.push("невідома кімната");
  }

  if (body.durationMs !== null && body.durationMs !== undefined) {
    const ms = Number(body.durationMs);
    if (!Number.isFinite(ms) || ms <= 0 || ms > MAX_BAN_DURATION_MS) {
      errors.push("невірна тривалість бану");
    }
  }

  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

export const validateUnbanRequest = (body) => {
  const errors = [];
  if (!Number.isInteger(Number(body.banId))) errors.push("banId обов'язковий");
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

export const validateReleaseConfinementRequest = (body) => {
  const errors = [];
  if (!isNonEmptyString(body.login)) errors.push("логін обов'язковий");
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};
