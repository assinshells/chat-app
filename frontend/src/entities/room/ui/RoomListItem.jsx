/**
 * RoomListItem — тупой компонент: одна строка списка комнат.
 * Разметка — тот же паттерн chat-user-img/avatar-title, что и в
 * остальном шаблоне (см. SideNav), чтобы список выглядел как часть
 * единого UI, а не отдельный кастомный виджет.
 *
 * userCount — сколько пользователей сейчас в этой комнате (см.
 * useRoomsStore.userCounts, приходит по Socket.IO в реальном
 * времени). Показывается бейджем справа от названия комнаты.
 */
export function RoomListItem({ room, onSelect, userCount = 0 }) {
  return (
    <li>
      <a href="#" className="text-decoration-none">
        <div className="d-flex align-items-center"
          onClick={(e) => {
            e.preventDefault();
            onSelect(room.id);
          }}
        >
          <div className="flex-grow-1 overflow-hidden">
            <h5 className="text-truncate font-size-14 mb-0">
              #{room.name}
              <span
                className="badge badge-soft-danger rounded-pill float-end"
                title="Користувачів у кімнаті"
              >
                {userCount}
              </span>
            </h5>
          </div>
        </div>
      </a>
    </li>
  );
}
