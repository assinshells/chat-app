import { ArrowLeft } from "lucide-react";

import { HeaderActions } from "./HeaderActions.jsx";
import { APP_NAME } from "@shared/constants/auth.constants.js";

/**
 * ChatHeader — шапка чату: на телефоні кнопка "Назад" (повертає до
 * списків із нижньою рейкою), крапка статусу з'єднання (.chat-status-dot:
 * зелена — онлайн, жовта пульсуюча — підключення) і назва кімнати або
 * ім'я співрозмовника (titleStyle — його колір). Праворуч — іконки
 * модалок: особисті повідомлення, фотогалерея, налаштування
 * (HeaderActions). Решта навігації — в лівій рейці (@widgets/left-sidebar).
 */
export function ChatHeader({ title, titleStyle, online, onBack }) {
  return (
    <header className="chat-header">
      <div className="chat-header-inner">
        <div className="chat-header-start">
          {onBack && (
            <button
              type="button"
              className="chat-header-btn chat-header-back"
              title="Назад"
              aria-label="Назад до списку"
              onClick={onBack}
            >
              <ArrowLeft size={20} />
            </button>
          )}

          <div className="chat-room-title" title={online ? "Онлайн" : "Підключення…"}>
            <span
              className={`chat-status-dot ${online ? "is-online" : "is-offline"}`}
              aria-hidden="true"
            />
            <span className="chat-brand-info">
              <span className="chat-brand-title" style={titleStyle}>
                {title || APP_NAME}
              </span>
            </span>
            <span className="visually-hidden">
              {online ? "Онлайн" : "Підключення…"}
            </span>
          </div>
        </div>

        <HeaderActions />
      </div>
    </header>
  );
}
