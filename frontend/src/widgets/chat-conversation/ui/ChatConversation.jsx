import { useEffect, useRef } from "react";

import { formatMessageTime } from "@shared/lib/message.js";
import { useAutoHideScrollbar } from "@shared/lib/useAutoHideScrollbar.js";

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
}) {
  const endRef = useRef(null);
  const scrollRef = useRef(null);

  useAutoHideScrollbar(scrollRef);

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

                    <span className="message-text">
                      {message.text}
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