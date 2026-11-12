import { useDmStore } from "@features/dm";
import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";
import { AppScrollbar } from "@shared/ui/scrollbar";

/**
 * DialogsList — список особистих діалогів (з лічильниками непрочитаних)
 * у вкладці "Чати" лівого сайдбара. Клік відкриває листування в основній
 * області чату (useDmStore.panelLogin → PrivateChat у ChatLayout).
 * Активний діалог підсвічено.
 */
export function DialogsList({ onOpen }) {
  const panelLogin = useDmStore((state) => state.panelLogin);
  const conversations = useDmStore((state) => state.conversations);
  const order = useDmStore((state) => state.order);
  const listLoading = useDmStore((state) => state.listLoading);
  const openConversation = useDmStore((state) => state.openConversation);

  const isDarkTheme = useIsDarkTheme();

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

        const lastLoaded = convo.messages[convo.messages.length - 1];
        const previewText = convo.lastMessage?.text ?? lastLoaded?.text;
        const previewHasImage = convo.lastMessage
          ? convo.lastMessage.hasImage
          : Boolean(lastLoaded?.image);
        // Повідомлення лише з картинкою не має тексту — показуємо мітку.
        const preview = previewText || (previewHasImage ? "[зображення]" : previewText);

        return (
          <button
            key={dialogLogin}
            type="button"
            className={`private-modal-dialog ${
              dialogLogin === panelLogin ? "is-active" : ""
            }`}
            aria-current={dialogLogin === panelLogin ? "true" : undefined}
            onClick={() => {
              openConversation(dialogLogin, convo.color);
              onOpen?.(dialogLogin);
            }}
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
