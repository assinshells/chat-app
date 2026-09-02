import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Send } from "lucide-react";

import { getColorHex } from "@shared/constants/color.constants.js";
import { formatMessageTime } from "@shared/lib/message.js";
import { useAutoHideScrollbar } from "@shared/lib/useAutoHideScrollbar.js";
import { useDmStore } from "@features/dm/model/useDmStore.js";

/**
 * DirectMessagesModal — єдина модалка особистих повідомлень на весь
 * застосунок (рендериться один раз у ChatLayout, як SettingsModal/
 * LogoutConfirmModal у Sidebar — див. їхній коментар про createPortal).
 * Доставка реальна — через персональний сокет-канал користувача (див.
 * backend sockets/dm.socket.js) і таблицю private_messages, а не
 * локальний стейт-стаб.
 *
 * Два входи в неї (див. Sidebar.jsx, ChatConversation.jsx, ChatHeader.jsx):
 *  - "Написати особисте повідомлення" у конкретного ніка — відкриває
 *    одразу діалог з цією людиною (useDmStore.openConversation);
 *  - іконка в шапці — відкриває "інбокс" як є, без вибору конкретного
 *    адресата, завжди з актуальним списком діалогів (useDmStore.openInbox).
 *
 * Розкладка: зліва вертикальні вкладки діалогів зі своїм скролбаром
 * (app-scrollbar, як і всюди в застосунку), справа — саме вікно
 * листування з обраним співрозмовником.
 *
 * На мобільному (див. @media в app.css) панелі показуються по одній —
 * яка саме, вирішує useDmStore.mobileView, а не ця точка входу сама по
 * собі: openInbox (шапка) виставляє 'list', openConversation
 * (клік у ніка) — одразу 'conversation'. Кнопка "Назад" у шапці
 * листування (видна лише на мобільному, див. .dm-modal-back-btn)
 * повертає до списку, не закриваючи модалку. На десктопі mobileView ні
 * на що не впливає — обидві панелі видно завжди.
 */
export function DirectMessagesModal({ modalId = "dmModal" }) {
  const {
    currentUser,
    conversations,
    order,
    activeLogin,
    listLoading,
    sendError,
    mobileView,
    selectConversation,
    showConversationList,
    sendMessage,
    clearSendError,
    setModalOpen,
    markAsRead,
  } = useDmStore();

  const [draft, setDraft] = useState("");

  const modalRef = useRef(null);
  const tabsRef = useRef(null);
  const messagesRef = useRef(null);
  const endRef = useRef(null);
  useAutoHideScrollbar(tabsRef);
  useAutoHideScrollbar(messagesRef);

  // Модалка рендериться завжди (портал у document.body), видимість на
  // екрані перемикає сам Bootstrap через CSS/JS — React про це інакше
  // не дізнався б. Потрібно для лічильника непрочитаних: поки модалка
  // реально не видна, нові dm:new зараховуються як непрочитані
  // (див. modalOpen у useDmStore), а щойно з'явилася — активна
  // вкладка одразу позначається прочитаною.
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return undefined;

    const handleShown = () => {
      setModalOpen(true);
      const login = useDmStore.getState().activeLogin;
      if (login) markAsRead(login);
      // Поки модалка була прихована (display:none у Bootstrap-модалки),
      // scrollIntoView з ефекту нижче міг не спрацювати — довершимо
      // прокрутку тепер, коли контент реально видно і він має layout.
      endRef.current?.scrollIntoView({ block: "end" });
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

  // Автопрокрутка до останнього повідомлення — при перемиканні діалогу
  // і при появі нових повідомлень (прийшла історія з сервера,
  // надіслали своє, отримали вхідне). Той самий патерн, що й у
  // ChatConversation (endRef — порожній якір в кінці списку, scrollIntoView
  // без анімації).
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [activeLogin, active?.messages?.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeLogin) return;

    setDraft("");
    await sendMessage(activeLogin, text);
    // При помилці (див. sendError у сторі) текст користувачу
    // повертати не будемо — простіше залишити як є і дати передрукувати:
    // чернетка могла встигнути застаріти (наприклад, помилка "recipient not found").
  };

  // Портал у document.body — див. детальне пояснення в SettingsModal.jsx
  // (той самий патерн: Bootstrap-модалка не повинна потрапляти в
  // піддерево сайдбара з overflow/transform).
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

          <div className={`dm-modal-body dm-modal-mobile-${mobileView}`}>
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

            {/* Саме вікно повідомлень обраного діалогу. Контейнер
                .dm-modal-messages рендериться ЗАВЖДИ (а не лише коли
                є активний діалог) — так ref для useAutoHideScrollbar
                прив'язується одразу при першому монтуванні модалки, а
                не втрачається при перемиканні між "немає діалогу"/"діалог
                відкрито" (ефект у хуку не перепідписується на зміну
                .current, лише на зміну самого об'єкта ref). */}
            <div className="dm-modal-conversation">
              {active && (
                <div className="dm-modal-conversation-header">
                  {/* Видна лише на мобільному (див. app.css) — на
                      десктопі список діалогів і так завжди поруч. */}
                  <button
                    type="button"
                    className="dm-modal-back-btn"
                    title="До списку діалогів"
                    onClick={showConversationList}
                  >
                    <ArrowLeft size={18} />
                  </button>
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
                {/* Якір для автопрокрутки (див. ефект вище) — порожній,
                    рендериться завжди, у т.ч. при порожньому/завантажуваному
                    діалозі, щоб ref не втрачався при зміні стану. */}
                <div ref={endRef} />
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
