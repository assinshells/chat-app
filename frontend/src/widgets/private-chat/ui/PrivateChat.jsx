import { useEffect, useRef, useState } from "react";
import { Ban, Send } from "lucide-react";

import { useDmStore } from "@features/dm";
import { formatMessageTime, normalizeMessageText } from "@shared/lib/message.js";

// Той самий ліміт, що й у публічному чаті (ChatComposer) і в панелі
// особистих повідомлень, і на бекенді
// (DM_LIMITS.MAX_MESSAGE_LENGTH).
const MAX_MESSAGE_LENGTH = 300;

/**
 * PrivateChat — листування з одним співрозмовником усередині правої панелі
 * особистих повідомлень (@widgets/private-chat/ui/PrivateMessagesPanel).
 * Шапка (назва/"Назад"/закриття) належить SidePanel, тут лише
 * повідомлення і форма відправлення.
 *
 * Джерело даних — useDmStore (персональний сокет-канал dm:*), той
 * самий, що наповнює список діалогів і лічильник у навбарі.
 */
export function PrivateChat({ login }) {
  const currentUser = useDmStore((state) => state.currentUser);
  const convo = useDmStore((state) => state.conversations[login]);
  const sendError = useDmStore((state) => state.sendError);
  const sendMessage = useDmStore((state) => state.sendMessage);
  const clearSendError = useDmStore((state) => state.clearSendError);

  const [draft, setDraft] = useState("");
  const endRef = useRef(null);

  // Чернетка навмисно НЕ скидається тут ефектом: компонент
  // монтується заново на кожен діалог (key={login} у ChatLayout),
  // тому при перемиканні співрозмовника draft і так починається
  // порожнім, без зайвого каскадного рендеру.

  // Автопрокрутка до останнього повідомлення — той самий патерн, що й
  // у ChatConversation (порожній якір у кінці
  // списку + scrollIntoView без анімації).
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [login, convo?.messages?.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = normalizeMessageText(draft).trim();
    if (!text) return;

    setDraft("");
    await sendMessage(login, text);
  };

  return (
    <div className="private-chat">
      <div className="private-chat-messages">
        <div className="app-scrollbar no-horizontal" style={{ height: "100%" }}>
          <div className="private-chat-messages-list">
            {convo?.loading ? (
              <div className="private-chat-empty">Завантаження…</div>
            ) : !convo || convo.messages.length === 0 ? (
              <div className="private-chat-empty">
                Повідомлень ще немає. Напишіть перше!
              </div>
            ) : (
              convo.messages.map((message) => (
                <div
                  key={message.id}
                  className={`private-chat-message ${
                    message.sender === currentUser ? "is-own" : "is-other"
                  }`}
                >
                  <span className="private-chat-message-time">
                    {formatMessageTime(message.timestamp)}
                  </span>
                  <span className="private-chat-message-text">{message.text}</span>
                </div>
              ))
            )}
            {/* Якір для автопрокрутки (див. ефект вище) — рендериться
                завжди, у т.ч. при порожньому діалозі, щоб ref не
                губився при зміні стану. */}
            <div ref={endRef} />
          </div>
        </div>
      </div>

      {/* blocked — хтось із двох боків заблокував іншого (див.
          useDmStore._loadHistory/_handleBlockedChanged): замість форми
          показуємо причину, щоб не отримувати мовчазне "не вдалося
          надіслати" після спроби. Реальна заборона — на бекенді. */}
      {convo?.blocked ? (
        <div className="private-chat-blocked-notice">
          <Ban size={16} />
          <span>Не можна надіслати повідомлення цьому користувачу</span>
        </div>
      ) : (
        <>
          {sendError && <p className="private-chat-error">{sendError}</p>}

          <form className="private-chat-composer" onSubmit={handleSend}>
            <input
              type="text"
              className="private-chat-input"
              placeholder={`Повідомлення ${login}...`}
              value={draft}
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={(e) => {
                setDraft(
                  normalizeMessageText(e.target.value).slice(0, MAX_MESSAGE_LENGTH),
                );
                if (sendError) clearSendError();
              }}
            />
            <span
              className={`private-chat-char-count ${
                draft.length >= MAX_MESSAGE_LENGTH ? "is-limit" : ""
              }`}
            >
              {draft.length}/{MAX_MESSAGE_LENGTH}
            </span>
            <button
              type="submit"
              className="private-chat-send-btn"
              disabled={!draft.trim()}
              title="Надіслати"
            >
              <Send size={16} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
