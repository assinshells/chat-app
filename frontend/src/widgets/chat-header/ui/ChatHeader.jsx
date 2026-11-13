import { HeaderActions } from "./HeaderActions.jsx";
import { APP_NAME } from "@shared/constants/auth.constants.js";

/**
 * ChatHeader — шапка чату: крапка статусу з'єднання (.chat-status-dot:
 * зелена — онлайн, жовта пульсуюча — підключення) і назва кімнати або
 * ім'я співрозмовника (titleStyle — його колір). Праворуч — іконки
 * (HeaderActions): особисті повідомлення, фотогалерея, налаштування і
 * вихід (остання). На телефоні додатково — іконка правого сайдбара.
 */
export function ChatHeader({ title, titleStyle, online, logoutModalId }) {
  return (
    <header className="chat-header">
      <div className="chat-header-inner">
        <div className="chat-header-start">
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

        <HeaderActions logoutModalId={logoutModalId} />
      </div>
    </header>
  );
}
