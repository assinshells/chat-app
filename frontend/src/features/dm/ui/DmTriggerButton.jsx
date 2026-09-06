import { User } from "lucide-react";

import { useDmStore } from "@features/dm/model/useDmStore.js";
import { useRolesStore } from "@features/roles/model/useRolesStore.js";
import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { ROLE_MANAGER_ROLES } from "@shared/constants/role.constants.js";

/**
 * DmTriggerButton — кнопка "три вертикальні крапки" поруч з чужим ніком
 * (використовується і в Sidebar.jsx — список "Користувачі", і в
 * ChatConversation.jsx — автор повідомлення). Пункти меню:
 *  - написати особисте повідомлення (усім, завжди);
 *  - "Керувати роллю" — лише якщо ВЛАСНА роль поточного користувача
 *    admin/superadmin (ROLE_MANAGER_ROLES). Можливість призначити саме
 *    "адміністратора" (лише для суперадміна) перевіряється вже в
 *    модалці/на бекенді, тут — лише видимість самого пункту меню.
 *
 * login/color — той, з ким починаємо діалог або чию роль керуємо
 * (колір — щоб модалка одразу могла зафарбувати ім'я, не роблячи
 * окремого запиту).
 */
export function DmTriggerButton({
  login,
  color,
  modalId = "dmModal",
  roleModalId = "roleManageModal",
}) {
  const openConversation = useDmStore((state) => state.openConversation);
  const openRoleManager = useRolesStore((state) => state.openFor);
  const ownRole = useCurrentUserStore((state) => state.role);
  const canManageRoles = ROLE_MANAGER_ROLES.includes(ownRole);

  return (
    <div className="dropdown dm-trigger-dropdown">
      <button
        type="button"
        className="dm-trigger-btn"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        title="Дії"
        onClick={(e) => e.stopPropagation()}
      >
        <User size="0.8em" />
      </button>

      <div className="dropdown-menu dm-trigger-menu">
        <a
          className="dropdown-item"
          href="#"
          data-bs-toggle="modal"
          data-bs-target={`#${modalId}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openConversation(login, color);
          }}
        >
          Написати особисте повідомлення
        </a>

        {canManageRoles && (
          <a
            className="dropdown-item"
            href="#"
            data-bs-toggle="modal"
            data-bs-target={`#${roleModalId}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openRoleManager(login, color);
            }}
          >
            Керувати роллю
          </a>
        )}
      </div>
    </div>
  );
}
