// Ролі користувачів — значення точно збігаються з backend
// (backend/src/constants/auth.constants.js ROLE_VALUES). Змінюються разом.
export const ROLE_VALUES = Object.freeze({
  USER: "user",
  MODERATOR: "moderator",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
});

// Ролі, які можна призначити через модалку керування роллю (features/roles).
// 'user' — це "без ролі" (знімається окремою дією "Зняти роль"), а
// 'superadmin' через UI не призначається взагалі — існує рівно один,
// заведений при старті бекенда.
export const ASSIGNABLE_ROLE_OPTIONS = Object.freeze([
  { value: ROLE_VALUES.MODERATOR, label: "Модератор" },
  { value: ROLE_VALUES.ADMIN, label: "Адміністратор" },
]);

// Ролі, яким показуємо пункт "Керувати роллю" в меню біля чужого ніка
// (див. features/dm/ui/DmTriggerButton.jsx) — має збігатися з backend
// ROLE_MANAGER_ROLES, інакше пункт меню видно, а запит впаде 403.
export const ROLE_MANAGER_ROLES = Object.freeze([
  ROLE_VALUES.ADMIN,
  ROLE_VALUES.SUPERADMIN,
]);

const ROLE_LABELS = Object.freeze({
  [ROLE_VALUES.USER]: "Без ролі",
  [ROLE_VALUES.MODERATOR]: "Модератор",
  [ROLE_VALUES.ADMIN]: "Адміністратор",
  [ROLE_VALUES.SUPERADMIN]: "Суперадміністратор",
});

export const getRoleLabel = (role) => ROLE_LABELS[role] ?? role;
