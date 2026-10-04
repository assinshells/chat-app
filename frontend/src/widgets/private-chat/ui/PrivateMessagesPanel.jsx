import { useDmStore } from "@features/dm";
import { PrivateChat } from "./PrivateChat.jsx";
import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";
import { AppScrollbar } from "@shared/ui/scrollbar";

/**
 * PrivateMessagesPanel — вміст правої панелі "Особисті повідомлення"
 * (шапка з назвою/"назад"/закриттям належить SidePanel).
 *
 * Два стани, ключ — useDmStore.panelLogin:
 *  - panelLogin === null: список діалогів (з лічильниками непрочитаних);
 *  - panelLogin заданий: листування з цією людиною (PrivateChat).
 *
 * Коли панель закривається, ChatLayout викликає closeConversation —
 * тож повідомлення не вважаються "переглянутими", поки панель
 * закрита (див. useDmStore._handleIncoming), а наступне відкриття
 * починається зі списку.
 */
export function PrivateMessagesPanel() {
  const panelLogin = useDmStore((state) => state.panelLogin);
  const conversations = useDmStore((state) => state.conversations);
  const order = useDmStore((state) => state.order);
  const listLoading = useDmStore((state) => state.listLoading);
  const openConversation = useDmStore((state) => state.openConversation);

  const isDarkTheme = useIsDarkTheme();

  if (panelLogin) {
    return <PrivateChat key={panelLogin} login={panelLogin} />;
  }

  if (order.length === 0) {
    return (
      <div className="private-modal-empty">
        {listLoading ? "Завантаження…" : "Немає розпочатих діалогів"}
      </div>
    );
  }

  return (
    <AppScrollbar className="private-modal-list">
      {order.map((dialogLogin) => {
        const convo = conversations[dialogLogin];
        if (!convo) return null;

        const preview =
          convo.lastMessage?.text ??
          convo.messages[convo.messages.length - 1]?.text;

        return (
          <button
            key={dialogLogin}
            type="button"
            className="private-modal-dialog"
            onClick={() => openConversation(dialogLogin, convo.color)}
          >
            <span className="private-modal-dialog-row">
              <span
                className="private-modal-dialog-name"
                style={{
                  color: getEffectiveColorHex(convo.color, isDarkTheme),
                }}
              >
                {dialogLogin}
              </span>
              {convo.unreadCount > 0 && (
                <span className="badge bg-danger">
                  {convo.unreadCount > 99 ? "99+" : convo.unreadCount}
                </span>
              )}
            </span>
            <span className="private-modal-dialog-preview">
              {preview ?? "Немає повідомлень"}
            </span>
          </button>
        );
      })}
    </AppScrollbar>
  );
}
