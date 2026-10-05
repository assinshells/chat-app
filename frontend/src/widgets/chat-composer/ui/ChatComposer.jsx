import { useEffect, useRef, useState } from "react";
import { Smile, Paperclip, Send, X } from "lucide-react";
import { DmTriggerButton } from "@features/dm";
import { normalizeMessageText } from "@shared/lib/message.js";
import { IMAGE_ACCEPT, prepareImage, revokePreview } from "@shared/lib/image.js";
import { describeSendError, describeCooldownHint } from "@shared/lib/moderationMessages.js";

const MAX_MESSAGE_LENGTH = 300;

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
 * actionTarget — {login, color} останнього доданого ніка (null, якщо
 * ніків немає): для нього кнопка "три крапки" поруч із емодзі відкриває
 * меню дій (особисте, друзі, блокування, модерація); після будь-якої
 * дії нік прибирається з форми. Без ніка кнопка неактивна. activeRoom — кімната для модерації (кик/бан).
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
  actionTarget = null,
  activeRoom,
  disabled = false,
  disabledReason,
}) {
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sending, setSending] = useState(false);

  // image — прикріплена картинка ({blob, previewUrl}), уже стиснута і
  // готова до відправлення (див. shared/lib/image.js); показується
  // мініатюрою над полем вводу. preparing — триває стиснення.
  const [image, setImage] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);

  // Звільняємо objectURL прев'ю при розмонтуванні (напр. зміна кімнати
  // не розмонтовує, а вихід з чату — так).
  const imageRef = useRef(null);
  useEffect(() => {
    imageRef.current = image;
  }, [image]);
  useEffect(() => () => revokePreview(imageRef.current), []);

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

    return `${mentionsPrefix}${timePrefix}${text}`.trim();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    // Скидаємо value, щоб повторний вибір ТОГО САМОГО файлу знову
    // викликав change.
    e.target.value = "";
    if (!file) return;

    setImageError(null);
    setPreparing(true);
    try {
      const prepared = await prepareImage(file);
      revokePreview(image);
      setImage(prepared);
    } catch (err) {
      setImageError(err.message);
    } finally {
      setPreparing(false);
    }
  };

  const handleRemoveImage = () => {
    revokePreview(image);
    setImage(null);
    setImageError(null);
  };

  const handleSend = () => {
    const text = normalizeMessageText(message).trim();

    // Повідомлення може складатися лише з картинки (без тексту).
    if ((!text && !image) || sending || preparing || cooldownActive || disabled) return;

    const outgoingText = buildOutgoingText(text);
    const imageSnapshot = image;
    const targetsSnapshot = { nicknames: targetNicknames, times: targetTimes };

    setMessage("");
    setImage(null);
    setImageError(null);
    setSendError(null);
    onClearTargets?.();

    const result = onSend?.(outgoingText, imageSnapshot?.blob);

    // onSend може бути асинхронним (реальне відправлення через сокет) —
    // якщо сервер відхилив повідомлення або зв'язок обірвався, повертаємо
    // текст і обрані цілі назад у форму, щоб користувач не
    // втрачав набране.
    if (!result?.then) {
      revokePreview(imageSnapshot);
    }

    if (result?.then) {
      setSending(true);
      result
        .then(() => revokePreview(imageSnapshot))
        .catch((err) => {
          // Відправлення не вдалось — повертаємо й картинку (її
          // прев'ю ще не звільнено, див. then вище).
          if (imageSnapshot) setImage(imageSnapshot);
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
  //  0. якщо композер вимкнено ЗОВНІ (roomBan — заблоковано саме в цій
  //     кімнаті, див. useChatSocket.js/ChatLayout.jsx) — причина бану,
  //     вона важливіша за будь-яку локальну помилку/кулдаун;
  //  1. якщо є помилка останнього відправлення — зрозумілий текст за її
  //     кодом (для RATE_LIMITED/MUTED секунди беруться з ЖИВОГО cooldownMs,
  //     а не із зафіксованого в момент помилки числа — так відлік не
  //     "завмирає");
  //  2. якщо помилки немає, але кулдаун все ще триває (наприклад,
  //     відправлення було заблоковано локальним лімітером ДО звернення
  //     до сервера) — той самий живий відлік;
  //  3. інакше — стандартна підказка.
  const hintText =
    (disabled && disabledReason) ||
    imageError ||
    (activeError && (describeSendError(activeError.code, cooldownMs || activeError.details?.retryAfterMs) ?? activeError.message)) ||
    (cooldownActive ? describeCooldownHint(cooldownMs) : null);

  return (
    <footer className="chat-input-section">

      <div className="chat-composer">

        {/* =========================================
            ПІДКАЗКА / ПОМИЛКА ВІДПРАВЛЕННЯ
            Раніше рендерилась постійною смугою під формою (навіть
            порожньою, з &nbsp; для збереження висоти) і взагалі
            ховалась на мобільних (display: none). Тепер — спливаюча
            підказка над полем вводу, з'являється лише коли справді
            є що показати, і не займає місце в макеті, коли її немає.
            ========================================= */}

        {hintText && (
          <div className="chat-input-hint has-error">
            <span className="chat-input-error">{hintText}</span>
          </div>
        )}

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
            ПРИКРІПЛЕНЕ ЗОБРАЖЕННЯ (мініатюра)
            ========================================= */}

        {(image || preparing) && (
          <div className="composer-attachment">
            {preparing ? (
              <span className="composer-attachment-status">Обробка зображення…</span>
            ) : (
              <div className="composer-attachment-thumb">
                <img src={image.previewUrl} alt="Прикріплене зображення" />
                <button
                  type="button"
                  className="composer-attachment-remove"
                  title="Прибрати зображення"
                  aria-label="Прибрати зображення"
                  onClick={handleRemoveImage}
                >
                  <X size={12} />
                </button>
              </div>
            )}
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
          disabled={disabled}
          placeholder={
            disabled
              ? disabledReason || "Надсилання недоступне в цій кімнаті"
              : targetNicknames.length
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

            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_ACCEPT}
              hidden
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="composer-tool-btn"
              title="Прикріпити зображення (JPEG, PNG, WebP)"
              disabled={disabled || preparing || sending}
              onClick={() => fileInputRef.current?.click()}
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


            {/* Дії з обраним ніком (три крапки) */}

            <DmTriggerButton
              login={actionTarget?.login}
              color={actionTarget?.color}
              room={activeRoom}
              disabled={!actionTarget || disabled}
              dropup
              showHeader
              buttonClassName="composer-tool-btn"
              onAction={(login) => onRemoveNickname?.(login)}
            />


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
              disabled={(!message.trim() && !image) || sending || preparing || cooldownActive || disabled}
              title={
                disabled
                  ? disabledReason || "Надсилання недоступне"
                  : cooldownActive
                  ? describeCooldownHint(cooldownMs)
                  : "Надіслати повідомлення"
              }
              onClick={handleSend}
            >
              <Send size={17} />
            </button>

          </div>

        </div>

      </div>

    </footer>
  );
}
