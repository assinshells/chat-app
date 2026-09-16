import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Ban, Send } from "lucide-react";

import { useDmStore } from "@features/dm";
import { getEffectiveColorHex } from "@shared/constants/color.constants.js";
import { formatMessageTime, normalizeMessageText } from "@shared/lib/message.js";
import { useIsDarkTheme } from "@shared/lib/theme.js";

// Той самий ліміт, що й у публічному чаті (ChatComposer) і в модалці
// особистих повідомлень, і на бекенді
// (DM_LIMITS.MAX_MESSAGE_LENGTH).
const MAX_MESSAGE_LENGTH = 300;

/**
 * PrivateChat — приватний діалог, розгорнутий В ОСНОВНІЙ області чату
 * (замість стрічки кімнати), а не в модалці: вхід — вибір діалогу в
 * табі "Приватні" лівого сайдбара (див. ChatLeftSidebar).
 *
 * Джерело даних — useDmStore (персональний сокет-канал dm:*), той
 * самий, що наповнює список діалогів у сайдбарі: окремої модалки
 * особистих повідомлень більше немає, тому це єдине місце, де
 * показується листування, і лічильники непрочитаних не можуть
 * розійтися між двома вікнами.
 *
 * Кнопка "Назад" повертає основну область до публічної кімнати
 * (closeConversation) — сам чат кімнати при цьому нікуди не дівається:
 * сокет-підписка живе в ChatLayout і продовжує накопичувати
 * повідомлення, поки відкрито приватний діалог.
 */
export function PrivateChat({ login, onClose }) {
  const currentUser = useDmStore((state) => state.currentUser);
  const convo = useDmStore((state) => state.conversations[login]);
  const sendError = useDmStore((state) => state.sendError);
  const sendMessage = useDmStore((state) => state.sendMessage);
  const clearSendError = useDmStore((state) => state.clearSendError);

  const [draft, setDraft] = useState("");
  const endRef = useRef(null);

  const isDarkTheme = useIsDarkTheme();

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
      <div className="private-chat-header">
        <button
          type="button"
          className="private-chat-back-btn"
          title="Повернутися до кімнати"
          aria-label="Повернутися до кімнати"
          onClick={onClose}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="private-chat-header-info">
          <span
            className="private-chat-header-name"
            style={{ color: getEffectiveColorHex(convo?.color, isDarkTheme) }}
          >
            {login}
          </span>
          <span className="private-chat-header-subtitle">
            Приватний діалог
          </span>
        </div>
      </div>

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
