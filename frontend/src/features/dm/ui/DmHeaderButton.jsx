import { MessageCircle } from "lucide-react";

import { useDmStore } from "../model/useDmStore.js";

/**
 * DmHeaderButton — іконка особистих повідомлень у шапці: відкриває
 * модалку (@widgets/private-chat/ui/PrivateMessagesModal) і показує
 * сумарний лічильник непрочитаних по всіх діалогах.
 */
export function DmHeaderButton({ className = "" }) {
  const unread = useDmStore((state) =>
    Object.values(state.conversations).reduce(
      (sum, convo) => sum + (convo.unreadCount || 0),
      0,
    ),
  );
  const modalOpen = useDmStore((state) => state.modalOpen);
  const openModal = useDmStore((state) => state.openModal);

  return (
    <button
      type="button"
      className={`chat-header-btn chat-header-dm${modalOpen ? " is-active" : ""} ${className}`.trim()}
      title="Особисті повідомлення"
      aria-label={
        unread > 0
          ? `Особисті повідомлення, непрочитаних: ${unread}`
          : "Особисті повідомлення"
      }
      aria-haspopup="dialog"
      onClick={openModal}
    >
      <MessageCircle size={20} />
      {unread > 0 && (
        <span className="chat-header-badge badge rounded-pill bg-danger">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}
