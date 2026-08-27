import { useState } from "react";
import { Smile, Paperclip, Ellipsis, UserPlus, UserX, Ban, Send } from "lucide-react";
import { normalizeMessageText } from "@shared/lib/message.js";

const MAX_MESSAGE_LENGTH = 2000;

export function ChatComposer({ selectedUser, onSend }) {
  const [message, setMessage] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sending, setSending] = useState(false);

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

  const handleSend = () => {
    const text = normalizeMessageText(message).trim();

    if (!text || sending) return;

    setMessage("");
    setSendError(null);

    const result = onSend?.(text);

    // onSend может быть асинхронным (реальная отправка через сокет) —
    // если сервер отклонил сообщение или связь оборвалась, возвращаем
    // текст обратно в поле, чтобы пользователь не терял набранное.
    if (result?.then) {
      setSending(true);
      result
        .catch((err) => {
          setMessage(text);
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
            selectedUser
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