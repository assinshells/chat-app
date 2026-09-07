import { ValidationException } from "../exceptions/auth.exceptions.js";
import { ROOM_IDS } from "../constants/chat.constants.js";

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

// Верхня межа для "тимчасового" бану — трохи більше року. Захист від
// абсурдних значень з клієнта (durationMs — довільне число мс, а не
// один із фіксованих пресетів, див. constants/moderationAction.constants.js
// BAN_DURATION_PRESETS — це підказка для UI, а не єдиний дозволений набір).
const MAX_BAN_DURATION_MS = 366 * 24 * 60 * 60 * 1000;

// Кік — це "охолонути", а не покарання на дні: верхня межа набагато
// нижча за бан і, на відміну від нього, durationMs ОБОВ'ЯЗКОВИЙ —
// "кік назавжди" не існує (для цього є глобальний/room-бан).
const MAX_KICK_DURATION_MS = 60 * 60 * 1000;

export const validateKickRequest = (body) => {
  const errors = [];
  if (!isNonEmptyString(body.login)) errors.push("логін обов'язковий");
  if (!ROOM_IDS.includes(body.room)) errors.push("невідома кімната");

  const ms = Number(body.durationMs);
  if (!Number.isFinite(ms) || ms <= 0 || ms > MAX_KICK_DURATION_MS) {
    errors.push("невірна тривалість кіку");
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
