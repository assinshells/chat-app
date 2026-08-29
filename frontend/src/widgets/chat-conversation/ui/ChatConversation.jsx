import { useEffect, useRef } from "react";

import { formatMessageTime } from "@shared/lib/message.js";
import { useAutoHideScrollbar } from "@shared/lib/useAutoHideScrollbar.js";
import { getColorHex } from "@shared/constants/color.constants.js";

/**
 * renderMessageText — рендерит текст сообщения, подсвечивая упоминания
 * ников (например "@login", добавленное кликом по нику в ChatComposer):
 *
 *  - упоминание САМОГО СЕБЯ — всегда красным (.nickname-own), чтобы
 *    пользователь сразу замечал сообщения, адресованные лично ему —
 *    так же, как выделен его ник-автор в собственных сообщениях;
 *  - упоминание ЛЮБОГО ДРУГОГО известного пользователя (получателя
 *    сообщения) — цветом самого сообщения (см. messageColor/getColorHex),
 *    т.е. цветом, который выбрал в настройках автор сообщения.
 *
 * knownLogins — Set логинов участников текущей комнаты (см. roomUsers в
 * ChatLayout), нужен, чтобы не подсвечивать случайное "@что-то" в
 * тексте, не являющееся реальным ником.
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
 * ChatConversation — список сообщений комнаты.
 *
 * Ник автора (кроме своего собственного) и время сообщения кликабельны:
 * клик передаётся наверх через onNicknameClick/onTimeClick, чтобы
 * ChatComposer мог добавить их как "цели" отправки (до 3 ников и 3 меток
 * времени, см. ChatLayout). Уже выбранные значения подсвечиваются.
 */
export function ChatConversation({
  messages = [],
  currentUser,
  onNicknameClick,
  onTimeClick,
  selectedNicknames = [],
  selectedTimes = [],
  roomUsers = [],
}) {
  const endRef = useRef(null);
  const scrollRef = useRef(null);

  useAutoHideScrollbar(scrollRef);

  // Множество логинов участников комнаты — используется в renderMessageText,
  // чтобы подсветить цветом сообщения только реальные упоминания ников,
  // а не любой текст, случайно начинающийся с "@".
  const knownLogins = new Set(roomUsers.map((user) => user.login));

  // Автопрокрутка к последнему сообщению при добавлении нового.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <main ref={scrollRef} className="chat-conversation app-scrollbar">
      <div className="chat-messages">

        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <p>No messages yet. Say hi!</p>
          </div>
        ) : (
          <div className="message-list">

            {messages.map((message) => {
              const isOwn = message.author === currentUser;
              const timeLabel = formatMessageTime(message.timestamp);

              const isNicknameSelected = selectedNicknames.includes(message.author);
              const isTimeSelected = selectedTimes.includes(timeLabel);

              // Цвет текста сообщения — тот, что автор выбрал в настройках.
              // 'black' (значение по умолчанию) — НЕ форсируется явным
              // hex-кодом: в тёмной теме чистый чёрный текст был бы
              // нечитаемым на тёмном фоне, поэтому для дефолтного цвета
              // просто ничего не переопределяем и остаётся обычный
              // адаптивный цвет темы (var(--bs-body-color)). Ник автора
              // при этом цвет вообще не меняет — остаётся обычным, кроме
              // своего собственного (он всегда красный, .nickname-own).
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

                    {/* Время — кликабельно всегда: добавляет метку времени
                        в форму отправки (до 3 шт, см. ChatComposer). */}
                    <button
                      type="button"
                      className={`message-time message-time-btn ${
                        isTimeSelected ? "is-selected" : ""
                      }`}
                      title="Add time to message form"
                      onClick={() => onTimeClick?.(timeLabel)}
                    >
                      {timeLabel}
                    </button>{" "}

                    {/* Ник — кликабелен, кроме собственного: добавляет
                        адресата в форму отправки (до 3 шт). */}
                    {isOwn ? (
                      <span className="message-author nickname-own">
                        {message.author}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className={`message-author message-author-btn ${
                          isNicknameSelected ? "is-selected" : ""
                        }`}
                        title="Add user to message form"
                        onClick={() => onNicknameClick?.(message.author)}
                      >
                        {message.author}
                      </button>
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