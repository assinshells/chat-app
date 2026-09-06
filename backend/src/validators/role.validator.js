import { ValidationException } from "../exceptions/auth.exceptions.js";
import { ASSIGNABLE_ROLES, ROLE_VALUES } from "../constants/auth.constants.js";
import { ROOM_IDS } from "../constants/chat.constants.js";

const isNonEmptyString = (val) =>
  typeof val === "string" && val.trim().length > 0;

export const validateAssignRoleRequest = (body) => {
  const errors = [];

  if (!isNonEmptyString(body.login)) errors.push("логін обов'язковий");

  if (!ASSIGNABLE_ROLES.includes(body.role)) {
    errors.push(`роль має бути однією з: ${ASSIGNABLE_ROLES.join(", ")}`);
  } else if (body.role === ROLE_VALUES.MODERATOR) {
    if (!Array.isArray(body.rooms) || body.rooms.length === 0) {
      errors.push("потрібно обрати хоча б одну кімнату для модератора");
    } else if (!body.rooms.every((room) => ROOM_IDS.includes(room))) {
      errors.push("список кімнат містить невідому кімнату");
    }
  }

  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};

export const validateRemoveRoleRequest = (body) => {
  const errors = [];
  if (!isNonEmptyString(body.login)) errors.push("логін обов'язковий");
  if (errors.length) throw new ValidationException("Помилка валідації", errors);
};
