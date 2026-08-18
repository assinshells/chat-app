/**
 * ChatWindow — основная область чата: лента сообщений выбранного диалога
 * и поле отправки нового сообщения.
 *
 * Сейчас `children` — статичная заглушка (см. ChatPage), реальный чат
 * будет собираться из:
 *   - entities/message         (модель/рендер одного сообщения)
 *   - features/message/send    (форма/инпут отправки сообщения)
 * Их можно добавлять внутрь ChatWindow, не трогая ChatLayout.
 */
export function ChatWindow({ children }) {
  return (
    <div className="user-chat w-100 overflow-hidden">
      <div className="d-lg-flex">{children}</div>
    </div>
  );
}