import { useRef } from "react";
import { Ellipsis } from "lucide-react";

import { useDmStore } from "@features/dm/model/useDmStore.js";
import { useRolesStore } from "@features/roles/model/useRolesStore.js";
import { useModerationStore } from "@features/moderation/model/useModerationStore.js";
import { useBlockStore } from "@features/block/model/useBlockStore.js";
import { useFriendStore } from "@features/friends/model/useFriendStore.js";
import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { ROLE_MANAGER_ROLES } from "@shared/constants/role.constants.js";
import { canModerateRoom } from "@shared/constants/moderationAction.constants.js";
// Пункт "Написати особисте повідомлення" відкриває діалог у модалці
// приватних повідомлень (її тригер — іконка message-circle в навбарі).
import { useSidePanelStore, SIDE_PANELS } from "@shared/lib/sidePanelStore.js";

/**
 * DmTriggerButton — кнопка "три горизонтальні крапки" у формі
 * повідомлення, поруч із емодзі (див. ChatComposer.jsx). Неактивна, поки
 * у формі немає обраного ніка; коли є — меню діє на останній доданий
 * нік. Пункти меню:
 *  - "Профіль": відкриває праву панель із профілем користувача
 *    (UserProfileView, дані з GET /api/auth/profile/:login);
 *  - написати особисте повідомлення (усім, завжди): відкриває діалог
 *    у модалці приватних повідомлень (@widgets/private-chat);
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
 * (ChatComposer отримує activeRoom від ChatLayout) — саме вона є ціллю "в беспредел" (kickToBespredel);
 * "із чату"/"бан кімнати"/"бан чату" від конкретної room не залежать.
 */
export function DmTriggerButton({
  login,
  color,
  room,
  roleModalId = "roleManageModal",
  kickModalId = "kickModerationModal",
  banModalId = "banModerationModal",
  // Кнопка живе у формі повідомлення (ChatComposer): неактивна, поки
  // жодного ніка не обрано (disabled), меню розкривається вгору (dropup)
  // і підписане ніком, до якого застосовуються дії (showHeader).
  disabled = false,
  dropup = false,
  showHeader = false,
  buttonClassName = "",
  // onAction — викликається після будь-якої виконаної дії з меню
  // (ChatComposer прибирає нік із форми).
  onAction,
}) {
  const openConversation = useDmStore((state) => state.openConversation);
  const openRoleManager = useRolesStore((state) => state.openFor);
  const openModeration = useModerationStore((state) => state.openFor);

  const isBlocked = useBlockStore((state) => state.blockedLogins.has(login));
  const unblockUser = useBlockStore((state) => state.unblockUser);
  const requestBlock = useBlockStore((state) => state.requestBlock);

  const isFriend = useFriendStore((state) => state.friendLogins.has(login));
  const addFriend = useFriendStore((state) => state.addFriend);
  const removeFriend = useFriendStore((state) => state.removeFriend);

  const ownRole = useCurrentUserStore((state) => state.role);
  const ownModeratorRooms = useCurrentUserStore((state) => state.moderatorRooms);

  const canManageRoles = ROLE_MANAGER_ROLES.includes(ownRole);
  const canModerate = Boolean(room) && canModerateRoom(ownRole, ownModeratorRooms, room);

  // Після дії меню закриваємо явно (stopPropagation в обробниках не дає
  // події дійти до автозакриття Bootstrap, а кнопка одразу стає
  // неактивною), і лише потім повідомляємо onAction — той прибирає нік
  // із форми. Закриваємо кліком по тригеру: Bootstrap сам перемикає меню.
  const toggleRef = useRef(null);
  const closeMenu = () => {
    const toggle = toggleRef.current;
    if (toggle?.getAttribute("aria-expanded") === "true") toggle.click();
  };
  const finish = () => {
    closeMenu();
    onAction?.(login);
  };

  // Особисті повідомлення живуть у правій панелі (SidePanel): відкриваємо
  // її в режимі "dm" через спільний стор, діалог уже розгорнутий
  // openConversation вище.
  const handleOpenProfile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    useSidePanelStore.getState().openUserProfile(login);
    finish();
  };

  const handleOpenConversation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openConversation(login, color);
    useSidePanelStore.getState().open(SIDE_PANELS.DM);
    finish();
  };

  const handleToggleFriend = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFriend) {
      removeFriend(login);
    } else {
      addFriend(login);
    }
    finish();
  };

  const handleToggleBlock = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBlocked) {
      unblockUser(login);
      finish();
      return;
    }
    // Підтвердження — мала модалка (BlockConfirmModal у ChatLayout), а не
    // системний confirm: закриваємо меню й просимо підтвердження. Нік
    // із форми прибере сама модалка після "Заблокувати" (onBlocked).
    closeMenu();
    requestBlock(login);
  };

  return (
    <div className={`${dropup ? "dropup" : "dropdown"} dm-trigger-dropdown`}>
      <button
        type="button"
        className={`dm-trigger-btn ${buttonClassName}`.trim()}
        ref={toggleRef}
        data-bs-toggle="dropdown"
        aria-expanded="false"
        title={disabled ? "Оберіть нік, щоб побачити дії" : `Дії: ${login}`}
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
      >
        <Ellipsis size={18} />
      </button>

      <div className="dropdown-menu dm-trigger-menu">
        {showHeader && login && (
          <h6 className="dropdown-header dm-trigger-header">@{login}</h6>
        )}
        <a className="dropdown-item" href="#" onClick={handleOpenProfile}>
          Профіль
        </a>

        <a
          className="dropdown-item"
          href="#"
          onClick={handleOpenConversation}
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
              finish();
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
                finish();
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
                finish();
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
