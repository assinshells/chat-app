const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/**
 * MessageBubble — тупой компонент: одно сообщение в ленте.
 * Разметка (ctext-wrap/conversation-name/...) — из ChatWindow, вынесена
 * сюда, чтобы не дублироваться при рендере списка сообщений.
 *
 * "Свои" сообщения (isOwn) требуют обёртки <li className="right">
 * вокруг .conversation-list — так, а не модификатором на самом
 * .conversation-list, ожидает CSS шаблона (app/styles/app.css,
 * правила `.chat-conversation .right .conversation-list`).
 */
export function MessageBubble({ message, isOwn }) {
  return (
    <li className={isOwn ? "right" : undefined}>
      <div className="conversation-list">
        <div className="user-chat-content">
          <div className="ctext-wrap">
            <div className="ctext-wrap-content">
              {!isOwn && <div className="conversation-name">{message.authorLogin}</div>}
              <p className="mb-0">{message.content}</p>
              <p className="chat-time mb-0">
                <i className="ri-time-line align-middle"></i>{" "}
                <span className="align-middle">{formatTime(message.createdAt)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
