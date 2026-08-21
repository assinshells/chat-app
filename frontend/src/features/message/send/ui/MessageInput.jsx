import { useState } from "react";
import { X } from "lucide-react";

const MAX_LENGTH = 300;

/**
 * MessageInput — поле ввода + кнопка отправки, и (если выбраны
 * адресаты) панель "Кому: ..." над полем. onSend(content) вызывается
 * родителем (см. widgets/chat-window), который решает, как именно
 * сообщение уходит (Socket.IO) и кому оно адресовано — сам выбор
 * получателей (клик по нику в ленте) и его состояние живут в
 * ChatWindow, этот компонент только отображает уже выбранный список
 * и умеет его сбросить.
 *
 * recipients — [{id, login}] (до MAX_MESSAGE_RECIPIENTS штук),
 * onClearRecipients — сбросить весь выбор целиком (кнопка "Очистити"
 * рядом с панелью). Убрать одного получателя из списка можно кликом
 * по его нику ещё раз прямо в ленте сообщений (см. ChatWindow).
 *
 * Ограничение ввода — 300 символов (MAX_LENGTH), под полем счётчик
 * "введено/лимит". Крестик справа внутри поля появляется, только
 * когда есть текст, и просто стирает содержимое инпута.
 */
export function MessageInput({ onSend, disabled, recipients = [], onClearRecipients }) {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  };

  const handleClear = () => setValue("");

  const isLimit = value.length >= MAX_LENGTH;

  return (
    <>
      {recipients.length > 0 && (
        <div className="message-recipients-bar">
          <span className="message-recipients-label">Кому:</span>
          <span className="message-recipients-list">
            {recipients.map((r) => r.login).join(", ")}
          </span>
          <button
            type="button"
            className="message-recipients-clear"
            onClick={onClearRecipients}
            disabled={disabled}
            aria-label="Очистити вибір отримувачів"
          >
            <X size={14} />
            Очистити
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="row g-0">
        <div className="col">
          <div className="message-input-wrap">
            <input
              type="text"
              className="form-control form-control-lg bg-light border-light"
              placeholder="Enter Message..."
              value={value}
              onChange={(e) => setValue(e.target.value.slice(0, MAX_LENGTH))}
              disabled={disabled}
              maxLength={MAX_LENGTH}
            />
            {value.length > 0 && (
              <button
                type="button"
                className="message-input-clear"
                onClick={handleClear}
                disabled={disabled}
                aria-label="Очистити повідомлення"
              >
                <X size={16} />
              </button>
            )}
            <span className={`message-input-counter${isLimit ? " is-limit" : ""}`}>
              {value.length}/{MAX_LENGTH}
            </span>
          </div>
        </div>
        <div className="col-auto">
          <div className="chat-input-links ms-md-2 me-md-0">
            <ul className="list-inline mb-0">
              <li className="list-inline-item">
                <button
                  type="submit"
                  className="btn btn-primary font-size-16 btn-lg chat-send"
                  disabled={disabled || !value.trim()}
                >
                  <i className="ri-send-plane-2-fill"></i>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </form>
    </>
  );
}