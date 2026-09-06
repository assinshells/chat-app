import { User } from "lucide-react";

import { useDmStore } from "@features/dm/model/useDmStore.js";
import { useRolesStore } from "@features/roles/model/useRolesStore.js";
import { useModerationStore } from "@features/moderation/model/useModerationStore.js";
import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { ROLE_MANAGER_ROLES } from "@shared/constants/role.constants.js";
import { canModerateRoom } from "@shared/constants/moderationAction.constants.js";

/**
 * DmTriggerButton — кнопка "три вертикальні крапки" поруч з чужим ніком
 * (використовується і в Sidebar.jsx — список "Користувачі", і в
 * ChatConversation.jsx — автор повідомлення). Пункти меню:
 *  - написати особисте повідомлення (усім, завжди);
 *  - "Керувати роллю" — лише якщо ВЛАСНА роль admin/superadmin
 *    (ROLE_MANAGER_ROLES);
 *  - "Кик / бан" — якщо власна роль може модерувати саме `room`
 *    (canModerateRoom: admin/superadmin — будь-яку, moderator —
 *    лише свої moderatorRooms, див. useCurrentUserStore).
 * Реальна перевірка прав у всіх випадках все одно на бекенді — тут
 * лише видимість пунктів меню.
 *
 * login/color — той, з ким починаємо діалог або кого караємо (колір —
 * щоб модалка одразу могла зафарбувати ім'я, не роблячи окремого
 * запиту). room — кімната, з чийого списку/стрічки відкрито меню
 * (Sidebar передає activeRoom, ChatConversation — той самий activeRoom
 * ChatLayout'а) — саме вона є ціллю кіку/room-бану.
 */
export function DmTriggerButton({
  login,
  color,
  room,
  modalId = "dmModal",
  roleModalId = "roleManageModal",
  moderationModalId = "moderationModal",
}) {
  const openConversation = useDmStore((state) => state.openConversation);
  const openRoleManager = useRolesStore((state) => state.openFor);
  const openModeration = useModerationStore((state) => state.openFor);

  const ownRole = useCurrentUserStore((state) => state.role);
  const ownModeratorRooms = useCurrentUserStore((state) => state.moderatorRooms);

  const canManageRoles = ROLE_MANAGER_ROLES.includes(ownRole);
  const canModerate = Boolean(room) && canModerateRoom(ownRole, ownModeratorRooms, room);

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

        {canModerate && (
          <a
            className="dropdown-item"
            href="#"
            data-bs-toggle="modal"
            data-bs-target={`#${moderationModalId}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openModeration(login, color, room);
            }}
          >
            Кик / бан
          </a>
        )}
      </div>
    </div>
  );
}
