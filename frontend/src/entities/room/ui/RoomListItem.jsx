/**
 * RoomListItem — тупой компонент: одна строка списка комнат.
 * Разметка — тот же паттерн chat-user-img/avatar-title, что и в
 * остальном шаблоне (см. SideNav), чтобы список выглядел как часть
 * единого UI, а не отдельный кастомный виджет.
 */
export function RoomListItem({ room, active, onSelect }) {
  return (
    <li>
      <a
        href="#"
        className={`d-flex align-items-center py-2 text-decoration-none${
          active ? " text-primary fw-semibold" : "text-body"
        }`}
        onClick={(e) => {
          e.preventDefault();
          onSelect(room.id);
        }}
      >
        <div className="flex-shrink-0 chat-user-img align-self-center me-2">
          <div className="avatar-xs">
            <span className="avatar-title rounded-circle bg-soft-primary text-primary">
              {room.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex-grow-1 overflow-hidden">
          <p className="text-truncate mb-0">{room.name}</p>
        </div>
      </a>
    </li>
  );
}
