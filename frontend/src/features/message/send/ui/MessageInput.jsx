import { useState } from "react";
import { X } from "lucide-react";

const MAX_LENGTH = 300;

/**
 * MessageInput — тупой компонент: поле ввода + кнопка отправки.
 * onSend(content) вызывается родителем (см. widgets/chat-window),
 * который решает, как именно сообщение уходит (Socket.IO).
 *
 * Ограничение ввода — 300 символов (MAX_LENGTH), под полем счётчик
 * "введено/лимит". Крестик справа внутри поля появляется, только
 * когда есть текст, и просто стирает содержимое инпута.
 */
export function MessageInput({ onSend, disabled }) {
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
  );
}