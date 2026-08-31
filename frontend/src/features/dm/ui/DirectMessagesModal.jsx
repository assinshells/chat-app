import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Send } from "lucide-react";

import { getColorHex } from "@shared/constants/color.constants.js";
import { formatMessageTime } from "@shared/lib/message.js";
import { useAutoHideScrollbar } from "@shared/lib/useAutoHideScrollbar.js";
import { useDmStore } from "@features/dm/model/useDmStore.js";

/**
 * DirectMessagesModal — единая модалка личных сообщений на всё
 * приложение (рендерится один раз в ChatLayout, как SettingsModal/
 * LogoutConfirmModal в Sidebar — см. их комментарий про createPortal).
 * Доставка реальная — через персональный сокет-канал пользователя (см.
 * backend sockets/dm.socket.js) и таблицу private_messages, а не
 * локальный стейт-стаб.
 *
 * Два входа в неё (см. Sidebar.jsx, ChatConversation.jsx, ChatHeader.jsx):
 *  - "Написати особисте повідомлення" у конкретного ніка — открывает
 *    сразу на диалоге с этим человеком (useDmStore.openConversation);
 *  - иконка в шапке — открывает "инбокс" как есть, без выбора конкретного
 *    адресата, всегда с актуальным списком диалогов (useDmStore.openInbox).
 *
 * Раскладка: слева вертикальные вкладки диалогов со своим скроллбаром
 * (app-scrollbar, как и везде в приложении), справа — само окно
 * переписки с выбранным собеседником.
 */
export function DirectMessagesModal({ modalId = "dmModal" }) {
  const {
    currentUser,
    conversations,
    order,
    activeLogin,
    listLoading,
    sendError,
    selectConversation,
    sendMessage,
    clearSendError,
    setModalOpen,
    markAsRead,
  } = useDmStore();

  const [draft, setDraft] = useState("");

  const modalRef = useRef(null);
  const tabsRef = useRef(null);
  const messagesRef = useRef(null);
  useAutoHideScrollbar(tabsRef);
  useAutoHideScrollbar(messagesRef);

  // Модалка рендерится всегда (портал в document.body), видимость на
  // экране переключает сам Bootstrap через CSS/JS — React об этом
  // иначе не узнал бы. Нужно для счётчика непрочитанных: пока модалка
  // реально не видна, новые dm:new засчитываются как непрочитанные
  // (см. modalOpen в useDmStore), а как только показалась — активная
  // вкладка сразу помечается прочитанной.
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return undefined;

    const handleShown = () => {
      setModalOpen(true);
      const login = useDmStore.getState().activeLogin;
      if (login) markAsRead(login);
    };
    const handleHidden = () => setModalOpen(false);

    el.addEventListener("shown.bs.modal", handleShown);
    el.addEventListener("hidden.bs.modal", handleHidden);
    return () => {
      el.removeEventListener("shown.bs.modal", handleShown);
      el.removeEventListener("hidden.bs.modal", handleHidden);
    };
  }, [setModalOpen, markAsRead]);

  const active = activeLogin ? conversations[activeLogin] : null;

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeLogin) return;

    setDraft("");
    await sendMessage(activeLogin, text);
    // При ошибке (см. sendError в сторе) текст пользователю возвращать
    // не будем — проще оставить как есть и дать перепечатать: черновик
    // мог успеть устареть (например, ошибка "recipient not found").
  };

  // Портал в document.body — см. подробное объяснение в SettingsModal.jsx
  // (тот же самый паттерн: Bootstrap-модалка не должна попадать в
  // поддерево сайдбара с overflow/transform).
  return createPortal(
    <div
      ref={modalRef}
      className="modal fade"
      id={modalId}
      tabIndex="-1"
      aria-labelledby={`${modalId}Label`}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content dm-modal">
          <div className="modal-header">
            <h5 className="modal-title" id={`${modalId}Label`}>
              Особисті повідомлення
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Закрити"
            />
          </div>

          <div className="dm-modal-body">
            {/* Вертикальні вкладки діалогів + скролбар */}
            <div ref={tabsRef} className="dm-modal-tabs app-scrollbar">
              {order.length === 0 ? (
                <div className="dm-modal-empty-tabs">
                  {listLoading ? "Завантаження…" : "Немає розпочатих діалогів"}
                </div>
              ) : (
                order.map((login) => {
                  const convo = conversations[login];
                  const preview =
                    convo.lastMessage?.text ??
                    convo.messages[convo.messages.length - 1]?.text;

                  return (
                    <button
                      key={login}
                      type="button"
                      className={`dm-modal-tab ${
                        login === activeLogin ? "is-active" : ""
                      }`}
                      onClick={() => selectConversation(login)}
                    >
                      <span className="dm-modal-tab-row">
                        <span
                          className="dm-modal-tab-name"
                          style={
                            convo.color && convo.color !== "black"
                              ? { color: getColorHex(convo.color) }
                              : undefined
                          }
                        >
                          {login}
                        </span>
                        {convo.unreadCount > 0 && (
                          <span className="dm-modal-tab-badge">
                            {convo.unreadCount > 99 ? "99+" : convo.unreadCount}
                          </span>
                        )}
                      </span>
                      <span className="dm-modal-tab-preview">
                        {preview ?? "Немає повідомлень"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Само вікно повідомлень обраного діалогу. Контейнер
                .dm-modal-messages рендерится ВСЕГДА (а не только когда
                есть активный диалог) — так ref для useAutoHideScrollbar
                привязывается сразу при первом монтировании модалки, а не
                теряется при переключении между "нет диалога"/"диалог
                открыт" (эффект в хуке не переподписывается на смену
                .current, только на смену самого объекта ref). */}
            <div className="dm-modal-conversation">
              {active && (
                <div className="dm-modal-conversation-header">
                  <span
                    className="dm-modal-conversation-name"
                    style={
                      active.color && active.color !== "black"
                        ? { color: getColorHex(active.color) }
                        : undefined
                    }
                  >
                    {active.login}
                  </span>
                </div>
              )}

              <div ref={messagesRef} className="dm-modal-messages app-scrollbar">
                {!active ? (
                  <div className="dm-modal-placeholder">
                    Виберіть діалог зліва або натисніть «Написати особисте
                    повідомлення» біля ніка користувача в сайдбарі чи в чаті
                  </div>
                ) : active.loading ? (
                  <div className="dm-modal-empty-messages">Завантаження…</div>
                ) : active.messages.length === 0 ? (
                  <div className="dm-modal-empty-messages">
                    Повідомлень ще немає. Напишіть перше!
                  </div>
                ) : (
                  active.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`dm-modal-message ${
                        message.sender === currentUser ? "is-own" : "is-other"
                      }`}
                    >
                      <span className="dm-modal-message-time">
                        {formatMessageTime(message.timestamp)}
                      </span>
                      <span className="dm-modal-message-text">
                        {message.text}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {active && (
                <>
                  {sendError && (
                    <p className="dm-modal-error">{sendError}</p>
                  )}

                  <form className="dm-modal-composer" onSubmit={handleSend}>
                    <input
                      type="text"
                      className="dm-modal-input"
                      placeholder={`Повідомлення ${active.login}...`}
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        if (sendError) clearSendError();
                      }}
                    />
                    <button
                      type="submit"
                      className="dm-modal-send-btn"
                      disabled={!draft.trim()}
                      title="Надіслати"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
