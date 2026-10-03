import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";

import { useDmStore } from "@features/dm";
import { PrivateChat } from "./PrivateChat.jsx";
import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { PRIVATE_MODAL_ID } from "@shared/constants/privateModal.constants.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";

/**
 * PrivateMessagesModal — модалка приватних повідомлень. Відкривається
 * кнопкою message-circle в навбарі (data-bs-toggle="modal").
 *
 * Два стани, ключ — useDmStore.panelLogin:
 *  - panelLogin === null: шапка "Приватні повідомлення" + хрестик,
 *    у тілі лише список чатів (з лічильниками непрочитаних);
 *  - panelLogin заданий: шапка "← Назад" + хрестик, у тілі листування.
 *    "Назад" повертає до списку (closeConversation).
 *
 * При закритті модалки (hidden.bs.modal) діалог згортається, тож
 * наступне відкриття завжди починається зі списку, а повідомлення
 * не вважаються "переглянутими", поки модалка закрита (див.
 * useDmStore._handleIncoming).
 *
 * Рендериться через портал у document.body (як LogoutConfirmModal),
 * щоб не потрапити в піддерево з transform/overflow:hidden.
 */
export function PrivateMessagesModal({ modalId = PRIVATE_MODAL_ID }) {
  const panelLogin = useDmStore((state) => state.panelLogin);
  const conversations = useDmStore((state) => state.conversations);
  const order = useDmStore((state) => state.order);
  const listLoading = useDmStore((state) => state.listLoading);
  const openConversation = useDmStore((state) => state.openConversation);
  const closeConversation = useDmStore((state) => state.closeConversation);

  const isDarkTheme = useIsDarkTheme();

  useEffect(() => {
    const element = document.getElementById(modalId);
    if (!element) return undefined;

    const handleHidden = () => closeConversation();
    element.addEventListener("hidden.bs.modal", handleHidden);
    return () => element.removeEventListener("hidden.bs.modal", handleHidden);
  }, [modalId, closeConversation]);

  const peer = panelLogin ? conversations[panelLogin] : null;

  return createPortal(
    <div
      className="modal fade"
      id={modalId}
      tabIndex="-1"
      aria-labelledby={`${modalId}Label`}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content app-modal">
          <div className="modal-header private-modal-header">
            {panelLogin ? (
              <>
                <a
                  href="#"
                  className="private-modal-back"
                  onClick={(e) => {
                    e.preventDefault();
                    closeConversation();
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Назад</span>
                </a>
                <span
                  id={`${modalId}Label`}
                  className="private-modal-peer"
                  style={{ color: getEffectiveColorHex(peer?.color, isDarkTheme) }}
                >
                  {panelLogin}
                </span>
              </>
            ) : (
              <h5 className="modal-title" id={`${modalId}Label`}>
                Приватні повідомлення
              </h5>
            )}
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Закрити"
            />
          </div>

          <div className="modal-body private-modal-body">
            {panelLogin ? (
              <PrivateChat key={panelLogin} login={panelLogin} />
            ) : order.length === 0 ? (
              <div className="private-modal-empty">
                {listLoading ? "Завантаження…" : "Немає розпочатих діалогів"}
              </div>
            ) : (
              <div className="private-modal-list">
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
                          <span className="badge rounded-pill bg-danger">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
