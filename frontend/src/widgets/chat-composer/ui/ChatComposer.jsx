import { useState } from "react";
import { Smile, Paperclip, Ellipsis, UserPlus, UserX, Ban, Send, X } from "lucide-react";
import { normalizeMessageText } from "@shared/lib/message.js";

const MAX_MESSAGE_LENGTH = 2000;

/**
 * ChatComposer — форма отправки сообщения.
 *
 * targetNicknames / targetTimes — "цели" сообщения (до 3 каждого),
 * добавленные кликом по нику/времени в ChatConversation (см. ChatLayout,
 * где живёт это состояние). Они показываются чипами над полем ввода и
 * могут быть удалены по одному (крестик на чипе) или все сразу (кнопка
 * "Clear"). Сами по себе, без текста сообщения, они никуда не
 * отправляются — только вместе с непустым текстом.
 */
export function ChatComposer({
  selectedUser,
  onSend,
  targetNicknames = [],
  targetTimes = [],
  onRemoveNickname,
  onRemoveTime,
  onClearTargets,
  onRestoreTargets,
}) {
  const [message, setMessage] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sending, setSending] = useState(false);

  const hasTargets = targetNicknames.length > 0 || targetTimes.length > 0;

  const handleChange = (e) => {
    // Переносы строк (в т.ч. из вставленного многострочного текста)
    // схлопываются в пробел — сообщение всегда остаётся одной строкой.
    const value = normalizeMessageText(e.target.value);

    if (value.length <= MAX_MESSAGE_LENGTH) {
      setMessage(value);
    } else {
      setMessage(value.slice(0, MAX_MESSAGE_LENGTH));
    }

    if (sendError) setSendError(null);
  };

  // Enter — всегда отправляет сообщение (переносы строк в сообщениях
  // не допускаются, поэтому у Shift+Enter нет отдельного поведения).
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * buildOutgoingText — собирает финальный текст сообщения из выбранных
   * ников (@nick) и меток времени ([HH:MM:SS]) плюс собственно текста.
   * Вызывается только когда есть непустой текст — пустые ник/время сами
   * по себе никогда не формируют и не отправляют сообщение.
   */
  const buildOutgoingText = (text) => {
    const mentionsPrefix = targetNicknames.length
      ? `${targetNicknames.map((nick) => `@${nick}`).join(" ")} `
      : "";
    const timePrefix = targetTimes.length
      ? `[${targetTimes.join(", ")}] `
      : "";

    return `${mentionsPrefix}${timePrefix}${text}`;
  };

  const handleSend = () => {
    const text = normalizeMessageText(message).trim();

    if (!text || sending) return;

    const outgoingText = buildOutgoingText(text);
    const targetsSnapshot = { nicknames: targetNicknames, times: targetTimes };

    setMessage("");
    setSendError(null);
    onClearTargets?.();

    const result = onSend?.(outgoingText);

    // onSend может быть асинхронным (реальная отправка через сокет) —
    // если сервер отклонил сообщение или связь оборвалась, возвращаем
    // текст и выбранные цели обратно в форму, чтобы пользователь не
    // терял набранное.
    if (result?.then) {
      setSending(true);
      result
        .catch((err) => {
          // Сервер отклонил сообщение или связь оборвалась — возвращаем
          // и текст, и выбранные ранее цели (ники/время), чтобы
          // пользователь мог просто повторить отправку.
          setMessage(text);
          onRestoreTargets?.(targetsSnapshot);
          setSendError(err?.message || "Failed to send message");
        })
        .finally(() => setSending(false));
    }
  };

  const addEmoji = (emoji) => {
    if (message.length + emoji.length > MAX_MESSAGE_LENGTH) {
      return;
    }

    setMessage((prev) => `${prev}${emoji}`);
  };

  return (
    <footer className="chat-input-section">

      <div className="chat-composer">

        {/* =========================================
            TARGETS (selected nicknames / times)
            ========================================= */}

        {hasTargets && (
          <div className="composer-targets">

            {targetNicknames.map((nick) => (
              <span key={`nick-${nick}`} className="composer-chip composer-chip-nickname">
                @{nick}
                <button
                  type="button"
                  className="composer-chip-remove"
                  title={`Remove ${nick}`}
                  onClick={() => onRemoveNickname?.(nick)}
                >
                  <X size={12} />
                </button>
              </span>
            ))}

            {targetTimes.map((time) => (
              <span key={`time-${time}`} className="composer-chip composer-chip-time">
                {time}
                <button
                  type="button"
                  className="composer-chip-remove"
                  title={`Remove ${time}`}
                  onClick={() => onRemoveTime?.(time)}
                >
                  <X size={12} />
                </button>
              </span>
            ))}

            <button
              type="button"
              className="composer-chip-clear"
              onClick={() => onClearTargets?.()}
            >
              Clear
            </button>

          </div>
        )}


        {/* =========================================
            TEXTAREA
            ========================================= */}

        <textarea
          className="chat-input"
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={1}
          placeholder={
            targetNicknames.length
              ? `Message ${targetNicknames.map((n) => `@${n}`).join(", ")}...`
              : selectedUser
              ? `Message ${selectedUser.name}...`
              : "Message..."
          }
        />


        {/* =========================================
            COMPOSER BOTTOM
            ========================================= */}

        <div className="chat-composer-bottom">

          <div className="chat-composer-left">

            {/* Attachment */}

            <button
              type="button"
              className="composer-tool-btn"
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>


            {/* Emoji */}

            <div className="composer-dropdown">

              <button
                type="button"
                className="composer-tool-btn"
                title="Emoji"
                onClick={() =>
                  setShowEmoji((prev) => !prev)
                }
              >
                <Smile size={18} />
              </button>

              {showEmoji && (
                <div className="emoji-picker">

                  {[
                    "😀",
                    "😂",
                    "😍",
                    "😊",
                    "👍",
                    "❤️",
                    "🔥",
                    "🎉",
                    "😎",
                    "🤔",
                    "😢",
                    "🙏",
                  ].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="emoji-item"
                      onClick={() => {
                        addEmoji(emoji);
                        setShowEmoji(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}

                </div>
              )}

            </div>


            {/* User actions */}

            {selectedUser && (
              <div className="composer-dropdown">

                <button
                  type="button"
                  className="composer-tool-btn"
                  title="User actions"
                  onClick={() =>
                    setShowActions((prev) => !prev)
                  }
                >
                  <Ellipsis size={18} />
                </button>


                {showActions && (
                  <div className="user-actions-menu">

                    <div className="user-actions-header">
                      <span>
                        {selectedUser.name}
                      </span>
                    </div>


                    <button
                      type="button"
                      className="user-action-item"
                      onClick={() => {
                        console.log(
                          "Add friend",
                          selectedUser
                        );
                        setShowActions(false);
                      }}
                    >
                      <UserPlus size={16} />

                      <span>
                        Add to friends
                      </span>
                    </button>


                    <button
                      type="button"
                      className="user-action-item"
                      onClick={() => {
                        console.log(
                          "Ignore",
                          selectedUser
                        );
                        setShowActions(false);
                      }}
                    >
                      <UserX size={16} />

                      <span>
                        Ignore
                      </span>
                    </button>


                    <button
                      type="button"
                      className="user-action-item danger"
                      onClick={() => {
                        console.log(
                          "Block",
                          selectedUser
                        );
                        setShowActions(false);
                      }}
                    >
                      <Ban size={16} />

                      <span>
                        Block user
                      </span>
                    </button>

                  </div>
                )}

              </div>
            )}

          </div>


          {/* =========================================
              COUNTER + SEND
              ========================================= */}

          <div className="chat-composer-right">

            <span
              className={`chat-character-count ${
                message.length >= MAX_MESSAGE_LENGTH
                  ? "is-limit"
                  : ""
              }`}
            >
              {message.length}/{MAX_MESSAGE_LENGTH}
            </span>


            <button
              type="button"
              className="chat-send-btn"
              disabled={!message.trim() || sending}
              title="Send message"
              onClick={handleSend}
            >
              <Send size={17} />
            </button>

          </div>

        </div>

      </div>


      <div className={`chat-input-hint ${sendError ? "has-error" : ""}`}>
        {sendError ? (
          <span className="chat-input-error">{sendError}</span>
        ) : (
          "AI can make mistakes. Check important information."
        )}
      </div>

    </footer>
  );
}