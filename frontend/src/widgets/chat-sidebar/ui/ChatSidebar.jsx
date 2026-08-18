/**
 * ChatSidebar — левая широкая колонка чата: список содержимого активной
 * вкладки (Users / Rooms / PrivateChat). Какая вкладка видна — решает
 * Bootstrap tab-pane/tab-content по id, синхронизированному с иконками
 * в SideNav, поэтому сам компонент состояние не хранит.
 *
 * Сейчас `children` — это статичные заглушки-заглушки (см. ChatPage),
 * в дальнейшем сюда лягут доменные виджеты списков:
 *   - entities/room  (список комнат)
 *   - entities/user   (список пользователей / контактов)
 *   - entities/chat   (список приватных переписок)
 */
export function ChatSidebar({ children }) {
  return (
    <div className="chat-leftsidebar me-lg-1 ms-lg-0">
      <div className="tab-content">{children}</div>
    </div>
  );
}