import { useEffect, useRef } from "react";

import { formatMessageTime } from "@shared/lib/message.js";
import { useAutoHideScrollbar } from "@shared/lib/useAutoHideScrollbar.js";
import { getColorHex } from "@shared/constants/color.constants.js";
import { hasRoomLink } from "@shared/lib/systemMessage.js";
import { ROOMS_BY_ID } from "@features/chat/constants/rooms.constants.js";
import { DmTriggerButton } from "@features/dm";

/**
 * renderMessageText — рендерить текст повідомлення, підсвічуючи згадки
 * ніків (наприклад "@login", додане кліком по ніку в ChatComposer):
 *
 *  - згадка САМОГО СЕБЕ — завжди червоним (.nickname-own), щоб
 *    користувач одразу помічав повідомлення, адресовані особисто йому —
 *    так само, як виділений його нік-автор у власних повідомленнях;
 *  - згадка БУДЬ-ЯКОГО ІНШОГО відомого користувача (отримувача
 *    повідомлення) — кольором самого повідомлення (див. messageColor/getColorHex),
 *    тобто кольором, який обрав у налаштуваннях автор повідомлення.
 *
 * knownLogins — Set логінів учасників поточної кімнати (див. roomUsers в
 * ChatLayout), потрібен, щоб не підсвічувати випадкове "@щось" у
 * тексті, що не є реальним ніком.
 */
function renderMessageText(text, currentUser, knownLogins, messageColorHex) {
  const ownMention = currentUser ? `@${currentUser}` : null;

  return text.split(/(\s+)/).map((part, index) => {
    if (ownMention && part === ownMention) {
      return (
        <span key={index} className="nickname-own">
          {part}
        </span>
      );
    }

    const mentionedLogin = part.startsWith("@") ? part.slice(1) : null;
    if (mentionedLogin && knownLogins?.has(mentionedLogin)) {
      return (
        <span key={index} style={{ color: messageColorHex }}>
          {part}
        </span>
      );
    }

    return part;
  });
}

/**
 * SystemMessageRow — системне сповіщення про вхід/перехід/вихід
 * (event: 'join'|'switch'|'leave', див. backend sockets/chat.socket.js).
 * Текст без родових форм (не залежить від статі), у кожної події —
 * свій порядок слів:
 *
 *  - join:   "{час} Ласкаво просимо до чату, {Нік}!"
 *  - switch: "{час} {Нік} переходить у кімнату {Назва}"
 *  - leave:  "{час} {Нік} покидає чат"
 *
 * Нік і назва кімнати (для switch) — клікабельні: нік — додає як
 * адресата у форму відправлення (як і в звичайних повідомленнях), кімната —
 * перемикає користувача туди ж.
 *
 * Колір ніка: свій власний — червоний (.nickname-own, той самий акцент,
 * що й усюди в застосунку), чужий — колір, який той користувач
 * обрав у налаштуваннях (див. features/settings).
 */
function SystemMessageRow({ message, currentUser, onNicknameClick, onRoomClick }) {
  const isOwn = message.login === currentUser;
  const timeLabel = formatMessageTime(message.timestamp);
  const roomName = ROOMS_BY_ID[message.room]?.name ?? message.room;

  const nicknameEl = isOwn ? (
    <span className="nickname-own">{message.login}</span>
  ) : (
    <button
      type="button"
      className="system-message-nickname-btn"
      title="Додати користувача у форму повідомлення"
      style={
        message.color && message.color !== "black"
          ? { "--user-color": getColorHex(message.color) }
          : undefined
      }
      onClick={() => onNicknameClick?.(message.login)}
    >
      {message.login}
    </button>
  );

  const roomEl = hasRoomLink(message.event) ? (
    <button
      type="button"
      className="system-message-room-btn"
      title="Перейти до кімнати"
      onClick={() => onRoomClick?.(message.room)}
    >
      {roomName}
    </button>
  ) : null;

  return (
    <div className="message message-system">
      <div className="message-content">
        <span className="message-time">{timeLabel}</span>{" "}
        {message.event === "join" && (
          <span className="system-message-text">
            Ласкаво просимо до чату, {nicknameEl}!
          </span>
        )}
        {message.event === "switch" && (
          <span className="system-message-text">
            {nicknameEl} переходить у кімнату {roomEl}
          </span>
        )}
        {message.event === "leave" && (
          <span className="system-message-text">{nicknameEl} покидає чат</span>
        )}
      </div>
    </div>
  );
}

/**
 * ChatConversation — список повідомлень кімнати.
 *
 * Нік автора (крім власного) і час повідомлення клікабельні:
 * клік передається наверх через onNicknameClick/onTimeClick, щоб
 * ChatComposer міг додати їх як "цілі" відправлення (до 3 ніків і 3 міток
 * часу, див. ChatLayout). Вже обрані значення підсвічуються.
 */
export function ChatConversation({
  messages = [],
  currentUser,
  onNicknameClick,
  onTimeClick,
  onRoomClick,
  selectedNicknames = [],
  selectedTimes = [],
  roomUsers = [],
}) {
  const endRef = useRef(null);
  const scrollRef = useRef(null);

  useAutoHideScrollbar(scrollRef);

  // Множина логінів учасників кімнати — використовується в renderMessageText,
  // щоб підсвітити кольором повідомлення лише реальні згадки ніків,
  // а не будь-який текст, що випадково починається з "@".
  const knownLogins = new Set(roomUsers.map((user) => user.login));

  // Автопрокрутка до останнього повідомлення при додаванні нового.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <main ref={scrollRef} className="chat-conversation app-scrollbar">
      <div className="chat-messages">

        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <p>Повідомлень ще немає. Напишіть перше!</p>
          </div>
        ) : (
          <div className="message-list">

            {messages.map((message) => {
              if (message.type === "system") {
                return (
                  <SystemMessageRow
                    key={message.id}
                    message={message}
                    currentUser={currentUser}
                    onNicknameClick={onNicknameClick}
                    onRoomClick={onRoomClick}
                  />
                );
              }

              const isOwn = message.author === currentUser;
              const timeLabel = formatMessageTime(message.timestamp);

              const isNicknameSelected = selectedNicknames.includes(message.author);
              const isTimeSelected = selectedTimes.includes(timeLabel);

              // Колір тексту повідомлення — той, що автор обрав у
              // налаштуваннях. 'black' (значення за замовчуванням) — НЕ
              // форсується явним hex-кодом: у темній темі чистий чорний
              // текст був би нечитабельним на темному фоні, тому для
              // дефолтного кольору просто нічого не перевизначаємо і
              // залишається звичайний адаптивний колір теми
              // (var(--bs-body-color)). Нік автора при цьому колір
              // взагалі не змінює — залишається звичайним, крім
              // власного (він завжди червоний, .nickname-own).
              const messageColorHex =
                message.color && message.color !== "black"
                  ? getColorHex(message.color)
                  : undefined;

              return (
                <div
                  key={message.id}
                  className={`message ${isOwn ? "message-user" : "message-other"}`}
                >

                  <div className="message-content">

                    {/* Час — клікабельний завжди: додає мітку часу
                        у форму відправлення (до 3 шт, див. ChatComposer). */}
                    <button
                      type="button"
                      className={`message-time message-time-btn ${
                        isTimeSelected ? "is-selected" : ""
                      }`}
                      title="Додати час у форму повідомлення"
                      onClick={() => onTimeClick?.(timeLabel)}
                    >
                      {timeLabel}
                    </button>{" "}

                    {/* Нік — клікабельний, крім власного: додає
                        адресата у форму відправлення (до 3 шт). */}
                    {isOwn ? (
                      <span className="message-author nickname-own">
                        {message.author}
                      </span>
                    ) : (
                      <>
                        <DmTriggerButton login={message.author} color={message.color} />
                        <button
                          type="button"
                          className={`message-author message-author-btn ${
                            isNicknameSelected ? "is-selected" : ""
                          }`}
                          title="Додати користувача у форму повідомлення"
                          onClick={() => onNicknameClick?.(message.author)}
                        >
                          {message.author}
                        </button>
                      </>
                    )}{" "}

                    <span className="message-text" style={{ color: messageColorHex }}>
                      {renderMessageText(
                        message.text,
                        currentUser,
                        knownLogins,
                        messageColorHex,
                      )}
                    </span>
                  </div>

                </div>
              );
            })}

            <div ref={endRef} />

          </div>
        )}

      </div>
    </main>
  );
}
