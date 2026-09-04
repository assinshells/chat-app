import { User } from "lucide-react";

import { useDmStore } from "@features/dm/model/useDmStore.js";

/**
 * DmTriggerButton — кнопка "три вертикальні крапки" поруч з чужим ніком
 * (використовується і в Sidebar.jsx — список "Користувачі", і в
 * ChatConversation.jsx — автор повідомлення). Один пункт меню: відкрити
 * DirectMessagesModal одразу на діалозі з цією людиною.
 *
 * login/color — той, з ким починаємо діалог (колір — щоб модалка одразу
 * могла зафарбувати його ім'я, не роблячи окремого запиту).
 */
export function DmTriggerButton({ login, color, modalId = "dmModal" }) {
  const openConversation = useDmStore((state) => state.openConversation);

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
      </div>
    </div>
  );
}
