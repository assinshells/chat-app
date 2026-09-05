import { useState } from "react";
import { Smile, Paperclip, Send, X } from "lucide-react";
import { normalizeMessageText } from "@shared/lib/message.js";
import { describeSendError, describeCooldownHint } from "@shared/lib/moderationMessages.js";

const MAX_MESSAGE_LENGTH = 2000;

/**
 * ChatComposer — форма відправлення повідомлення.
 *
 * targetNicknames / targetTimes — "цілі" повідомлення (до 3 кожного),
 * додані кліком по ніку/часу в ChatConversation (див. ChatLayout,
 * де живе цей стан). Вони показуються чипами над полем вводу і
 * можуть бути видалені по одному (хрестик на чипі) або всі одразу
 * (кнопка "Очистити"). Самі по собі, без тексту повідомлення, вони
 * нікуди не відправляються — лише разом з непорожнім текстом.
 *
 * cooldownMs — скільки мс залишилося до наступного дозволеного
 * відправлення (клієнтський rate-limit або серверний
 * RATE_LIMITED/MUTED, див. useChatSocket.js/useMessageCooldown.js).
 * Поки > 0, кнопка відправлення заблокована, а під полем вводу —
 * живий зворотний відлік замість мовчазного "повідомлення не пішло":
 * раніше ліміт перевірявся лише на сокеті, і користувач не розумів причину.
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

  // Щойно кулдаун, який спровокував останню помилку
  // (RATE_LIMITED/MUTED), минув — ця помилка вважається застарілою і
  // більше не показується (без setState в ефекті: просто не
  // використовуємо її при обчисленні hintText нижче, див. activeError).
  const errorCooldownExpired =
    sendError && (sendError.code === "RATE_LIMITED" || sendError.code === "MUTED") && cooldownMs <= 0;
  const activeError = errorCooldownExpired ? null : sendError;

  const handleChange = (e) => {
    // Переноси рядків (у т.ч. з вставленого багаторядкового тексту)
    // згортаються в пробіл — повідомлення завжди залишається одним рядком.
    const value = normalizeMessageText(e.target.value);

    if (value.length <= MAX_MESSAGE_LENGTH) {
      setMessage(value);
    } else {
      setMessage(value.slice(0, MAX_MESSAGE_LENGTH));
    }

    if (sendError) setSendError(null);
  };

  // Enter — завжди відправляє повідомлення (переноси рядків у
  // повідомленнях не допускаються, тому у Shift+Enter немає окремої поведінки).
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * buildOutgoingText — збирає фінальний текст повідомлення з обраних
   * ніків (@nick) і міток часу ([HH:MM:SS]) плюс власне тексту.
   * Викликається лише коли є непорожній текст — порожні нік/час самі
   * по собі ніколи не формують і не відправляють повідомлення.
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

    // onSend може бути асинхронним (реальне відправлення через сокет) —
    // якщо сервер відхилив повідомлення або зв'язок обірвався, повертаємо
    // текст і обрані цілі назад у форму, щоб користувач не
    // втрачав набране.
    if (result?.then) {
      setSending(true);
      result
        .catch((err) => {
          // Сервер відхилив повідомлення або зв'язок обірвався — повертаємо
          // і текст, і обрані раніше цілі (ніки/час), щоб
          // користувач міг просто повторити відправлення. Зберігаємо сам
          // об'єкт помилки (не лише message) — у ньому code/details,
          // за якими describeSendError нижче підбирає зрозуміле
          // формулювання і живий зворотний відлік замість технічного
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

  // Пріоритет підказки під полем вводу:
  //  1. якщо є помилка останнього відправлення — зрозумілий текст за її
  //     кодом (для RATE_LIMITED/MUTED секунди беруться з ЖИВОГО cooldownMs,
  //     а не із зафіксованого в момент помилки числа — так відлік не
  //     "завмирає");
  //  2. якщо помилки немає, але кулдаун все ще триває (наприклад,
  //     відправлення було заблоковано локальним лімітером ДО звернення
  //     до сервера) — той самий живий відлік;
  //  3. інакше — стандартна підказка.
  const hintText =
    (activeError && (describeSendError(activeError.code, cooldownMs || activeError.details?.retryAfterMs) ?? activeError.message)) ||
    (cooldownActive ? describeCooldownHint(cooldownMs) : null);

  return (
    <footer className="chat-input-section">

      <div className="chat-composer">

        {/* =========================================
            ЦІЛІ (обрані ніки / час)
            ========================================= */}

        {hasTargets && (
          <div className="composer-targets">

            {targetNicknames.map((nick) => (
              <span key={`nick-${nick}`} className="composer-chip composer-chip-nickname">
                @{nick}
                <button
                  type="button"
                  className="composer-chip-remove"
                  title={`Прибрати ${nick}`}
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
                  title={`Прибрати ${time}`}
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
              Очистити
            </button>

          </div>
        )}


        {/* =========================================
            ПОЛЕ ВВОДУ
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
              ? `Повідомлення для ${targetNicknames.map((n) => `@${n}`).join(", ")}...`
              : "Повідомлення..."
          }
        />


        {/* =========================================
            НИЖНЯ ЧАСТИНА COMPOSER
            ========================================= */}

        <div className="chat-composer-bottom">

          <div className="chat-composer-left">

            {/* Вкладення */}

            <button
              type="button"
              className="composer-tool-btn"
              title="Прикріпити файл"
            >
              <Paperclip size={18} />
            </button>


            {/* Емодзі */}

            <div className="composer-dropdown">

              <button
                type="button"
                className="composer-tool-btn"
                title="Емодзі"
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
              ЛІЧИЛЬНИК + ВІДПРАВЛЕННЯ
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
              title={cooldownActive ? describeCooldownHint(cooldownMs) : "Надіслати повідомлення"}
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
          "&nbsp;"
        )}
      </div>

    </footer>
  );
}
