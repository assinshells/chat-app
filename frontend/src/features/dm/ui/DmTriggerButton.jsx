import { User } from "lucide-react";

import { useDmStore } from "@features/dm/model/useDmStore.js";
import { useRolesStore } from "@features/roles/model/useRolesStore.js";
import { useModerationStore } from "@features/moderation/model/useModerationStore.js";
import { useBlockStore } from "@features/block/model/useBlockStore.js";
import { useFriendStore } from "@features/friends/model/useFriendStore.js";
import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { ROLE_MANAGER_ROLES } from "@shared/constants/role.constants.js";
import { canModerateRoom } from "@shared/constants/moderationAction.constants.js";

/**
 * DmTriggerButton — кнопка "три вертикальні крапки" поруч з чужим ніком
 * (використовується і в Sidebar.jsx — список "Користувачі", і в
 * ChatConversation.jsx — автор повідомлення). Пункти меню:
 *  - написати особисте повідомлення (усім, завжди);
 *  - "Додати до друзів" / "Видалити з друзів" (усім, завжди —
 *    персональна дія без підтвердження з боку іншої сторони, див.
 *    features/friends/model/useFriendStore.js): додає користувача у
 *    власний список друзів (вкладка "Друзі" в сайдбарі), нічого не
 *    змінює для самого доданого. Друзі й блокування — взаємовиключні
 *    стани (перевіряється на бекенді), тому пункт "Додати до друзів"
 *    прихований, поки користувач заблокований — лишається лише
 *    "Розблокувати";
 *  - "Заблокувати" / "Розблокувати" (усім, завжди — на відміну від
 *    ролевих пунктів нижче, це персональна дія, а не модерація, див.
 *    features/block/model/useBlockStore.js): заблокований користувач
 *    зникає з чату/списку користувачів ЛИШЕ для того, хто натиснув
 *    (фільтрація в ChatLayout), і більше не може писати особисті
 *    повідомлення (перевіряється на бекенді);
 *  - "Керувати роллю" — лише якщо ВЛАСНА роль admin/superadmin
 *    (ROLE_MANAGER_ROLES);
 *  - "Кикнути" / "Бан" — якщо власна роль може модерувати саме `room`
 *    (canModerateRoom: admin/superadmin — будь-яку, moderator —
 *    лише свої moderatorRooms, див. useCurrentUserStore). Кожен пункт
 *    відкриває СВОЮ модалку (KickModal/BanModal, обидві рендеряться
 *    один раз у ChatLayout) — вибір кнопки всередині кожної модалки
 *    вже визначає, яка саме дія (в беспредел/із чату, бан
 *    кімнати/бан чату) виконується.
 * Реальна перевірка прав у всіх випадках все одно на бекенді — тут
 * лише видимість пунктів меню.
 *
 * login/color — той, з ким починаємо діалог або кого караємо (колір —
 * щоб модалка одразу могла зафарбувати ім'я, не роблячи окремого
 * запиту). room — кімната, з чийого списку/стрічки відкрито меню
 * (Sidebar передає activeRoom, ChatConversation — той самий activeRoom
 * ChatLayout'а) — саме вона є ціллю "в беспредел" (kickToBespredel);
 * "із чату"/"бан кімнати"/"бан чату" від конкретної room не залежать.
 */
export function DmTriggerButton({
  login,
  color,
  room,
  modalId = "dmModal",
  roleModalId = "roleManageModal",
  kickModalId = "kickModerationModal",
  banModalId = "banModerationModal",
}) {
  const openConversation = useDmStore((state) => state.openConversation);
  const openRoleManager = useRolesStore((state) => state.openFor);
  const openModeration = useModerationStore((state) => state.openFor);

  const isBlocked = useBlockStore((state) => state.blockedLogins.has(login));
  const blockUser = useBlockStore((state) => state.blockUser);
  const unblockUser = useBlockStore((state) => state.unblockUser);

  const isFriend = useFriendStore((state) => state.friendLogins.has(login));
  const addFriend = useFriendStore((state) => state.addFriend);
  const removeFriend = useFriendStore((state) => state.removeFriend);

  const ownRole = useCurrentUserStore((state) => state.role);
  const ownModeratorRooms = useCurrentUserStore((state) => state.moderatorRooms);

  const canManageRoles = ROLE_MANAGER_ROLES.includes(ownRole);
  const canModerate = Boolean(room) && canModerateRoom(ownRole, ownModeratorRooms, room);

  const handleToggleFriend = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFriend) {
      removeFriend(login);
      return;
    }
    addFriend(login);
  };

  const handleToggleBlock = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBlocked) {
      unblockUser(login);
      return;
    }
    // Проста нативна підтвердка — на відміну від кіку/бану, це
    // персональна оборотна дія (розблокувати можна одним кліком зі
    // списку "Заблоковані" в сайдбарі), тому окрема модалка тут зайва.
    if (window.confirm(`Заблокувати користувача ${login}? Він зникне з чату та не зможе писати вам особисті повідомлення.`)) {
      blockUser(login);
    }
  };

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

        {(!isBlocked || isFriend) && (
          <a
            className="dropdown-item dropdown-item-friend-toggle"
            href="#"
            onClick={handleToggleFriend}
          >
            {isFriend ? "Видалити з друзів" : "Додати до друзів"}
          </a>
        )}

        <a
          className="dropdown-item dropdown-item-block-toggle"
          href="#"
          onClick={handleToggleBlock}
        >
          {isBlocked ? "Розблокувати" : "Заблокувати"}
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
          <>
            <a
              className="dropdown-item"
              href="#"
              data-bs-toggle="modal"
              data-bs-target={`#${kickModalId}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openModeration(login, color, room);
              }}
            >
              Кикнути
            </a>
            <a
              className="dropdown-item"
              href="#"
              data-bs-toggle="modal"
              data-bs-target={`#${banModalId}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openModeration(login, color, room);
              }}
            >
              Бан
            </a>
          </>
        )}
      </div>
    </div>
  );
}
