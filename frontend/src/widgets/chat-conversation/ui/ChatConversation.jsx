import { useEffect, useRef } from "react";

import { formatMessageTime } from "@shared/lib/message.js";
import { useAutoHideScrollbar } from "@shared/lib/useAutoHideScrollbar.js";
import { getColorHex } from "@shared/constants/color.constants.js";
import { hasRoomLink } from "@shared/lib/systemMessage.js";
import { ROOMS_BY_ID } from "@features/chat/constants/rooms.constants.js";
import { DmTriggerButton } from "@features/dm";

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
 * SystemMessageRow — системное уведомление о входе/переходе/выходе
 * (event: 'join'|'switch'|'leave', см. backend sockets/chat.socket.js).
 * Текст без родовых форм (не зависит от пола), у каждого события —
 * свой порядок слов:
 *
 *  - join:   "{час} Добро пожаловать в чат, {Нік}!"
 *  - switch: "{час} {Нік} переходит в комнату {Назва}"
 *  - leave:  "{час} {Нік} покидает чат"
 *
 * Ник и назва кімнати (для switch) — клікабельні: ник — добавляет как
 * адресата в форму отправки (как и в обычных сообщениях), кімната —
 * переключает пользователя туда же.
 *
 * Цвет ника: свой собственный — красный (.nickname-own, тот же акцент,
 * что и везде в приложении), чужой — цвет, который тот пользователь
 * выбрал в настройках (см. features/settings).
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
      title="Add user to message form"
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
      title="Go to room"
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
            Добро пожаловать в чат, {nicknameEl}!
          </span>
        )}
        {message.event === "switch" && (
          <span className="system-message-text">
            {nicknameEl} переходит в комнату {roomEl}
          </span>
        )}
        {message.event === "leave" && (
          <span className="system-message-text">{nicknameEl} покидает чат</span>
        )}
      </div>
    </div>
  );
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
  onRoomClick,
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
                      <>
                        <DmTriggerButton login={message.author} color={message.color} />
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