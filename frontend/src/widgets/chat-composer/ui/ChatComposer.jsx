import { useState } from "react";
import { Smile, Paperclip, Send, X } from "lucide-react";
import { normalizeMessageText } from "@shared/lib/message.js";
import { describeSendError, describeCooldownHint } from "@shared/lib/moderationMessages.js";

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
 *
 * cooldownMs — сколько мс осталось до следующей разрешённой отправки
 * (клиентский rate-limit или серверный RATE_LIMITED/MUTED, см.
 * useChatSocket.js/useMessageCooldown.js). Пока > 0, кнопка отправки
 * заблокирована, а под полем ввода — живой обратный отсчёт вместо
 * молчаливого "сообщение не ушло": раньше лимит проверялся только на
 * сокете, и пользователь не понимал причину.
 */
export function ChatComposer({
  onSend,
  cooldownMs = 0,
  targetNicknames = [],
  targetTimes = [],
  onRemoveNickname,
  onRemoveTime,
  onClearTargets,
  onRestoreTargets,
}) {
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sending, setSending] = useState(false);

  const hasTargets = targetNicknames.length > 0 || targetTimes.length > 0;
  const cooldownActive = cooldownMs > 0;

  // Как только кулдаун, который спровоцировал последнюю ошибку
  // (RATE_LIMITED/MUTED), истёк — эта ошибка считается устаревшей и
  // больше не показывается (без setState в эффекте: просто не
  // используем её при вычислении hintText ниже, см. activeError).
  const errorCooldownExpired =
    sendError && (sendError.code === "RATE_LIMITED" || sendError.code === "MUTED") && cooldownMs <= 0;
  const activeError = errorCooldownExpired ? null : sendError;

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

    if (!text || sending || cooldownActive) return;

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
          // пользователь мог просто повторить отправку. Сохраняем сам
          // объект ошибки (не только message) — в нём code/details,
          // по которым describeSendError ниже подбирает понятную
          // формулировку и живой обратный отсчёт вместо технического
          // "Failed to send message".
          setMessage(text);
          onRestoreTargets?.(targetsSnapshot);
          setSendError(err instanceof Error ? err : new Error(String(err)));
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

  // Приоритет подсказки под полем ввода:
  //  1. если есть ошибка последней отправки — понятный текст по её коду
  //     (для RATE_LIMITED/MUTED секунды берутся из ЖИВОГО cooldownMs,
  //     а не из зафиксированного в момент ошибки числа — так отсчёт не
  //     "замирает");
  //  2. если ошибки нет, но кулдаун всё ещё идёт (например, отправка
  //     была заблокирована локальным лимитером ДО обращения к серверу)
  //     — тот же живой отсчёт;
  //  3. иначе — стандартная подсказка.
  const hintText =
    (activeError && (describeSendError(activeError.code, cooldownMs || activeError.details?.retryAfterMs) ?? activeError.message)) ||
    (cooldownActive ? describeCooldownHint(cooldownMs) : null);

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
              disabled={!message.trim() || sending || cooldownActive}
              title={cooldownActive ? describeCooldownHint(cooldownMs) : "Send message"}
              onClick={handleSend}
            >
              <Send size={17} />
            </button>

          </div>

        </div>

      </div>


      <div className={`chat-input-hint ${hintText ? "has-error" : ""}`}>
        {hintText ? (
          <span className="chat-input-error">{hintText}</span>
        ) : (
          "AI can make mistakes. Check important information."
        )}
      </div>

    </footer>
  );
}