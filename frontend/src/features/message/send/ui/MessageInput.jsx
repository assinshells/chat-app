import { useState } from "react";

/**
 * MessageInput — тупой компонент: поле ввода + кнопка отправки.
 * onSend(content) вызывается родителем (см. widgets/chat-window),
 * который решает, как именно сообщение уходит (Socket.IO).
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

  return (
    <form onSubmit={handleSubmit} className="row g-0">
      <div className="col">
        <input
          type="text"
          className="form-control form-control-lg bg-light border-light"
          placeholder="Enter Message..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          maxLength={2000}
        />
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
