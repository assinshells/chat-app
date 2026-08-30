import { MoreVertical } from "lucide-react";

import { useDmStore } from "@features/dm/model/useDmStore.js";

/**
 * DmTriggerButton — кнопка "три вертикальные точки" рядом с чужим ником
 * (используется и в Sidebar.jsx — список "Користувачі", и в
 * ChatConversation.jsx — автор сообщения). Один пункт меню: открыть
 * DirectMessagesModal сразу на диалоге с этим человеком.
 *
 * login/color — тот, с кем начинаем диалог (цвет — чтобы модалка сразу
 * могла покрасить его имя, не делая отдельного запроса).
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
        <MoreVertical size={16} />
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
