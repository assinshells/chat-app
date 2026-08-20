import { Users } from "lucide-react";

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
export function RoomListItem({ room, active, onSelect, userCount = 0 }) {
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
        <div
          className="flex-shrink-0 ms-2 d-flex align-items-center gap-1 text-muted small"
          title="Користувачів у кімнаті"
        >
          <Users size={14} strokeWidth={2} />
          <span>{userCount}</span>
        </div>
      </a>
    </li>
  );
}
