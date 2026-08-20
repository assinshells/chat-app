import { useEffect } from "react";
import { useRoomsStore, RoomListItem } from "@entities/room";

/**
 * RoomList — содержимое вкладки "Rooms" в ChatSidebar: список
 * статических комнат (backend/src/constants/rooms.data.js). Создания
 * комнат нет — список фиксированный, поэтому виджет — просто загрузка
 * + рендер, без формы.
 */
export function RoomList({ activeRoomId, onSelectRoom }) {
  const { rooms, loading, error, loadRooms } = useRoomsStore();

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  return (
    <div className="p-3">
      {error && <p className="text-danger small mb-2">{error}</p>}

      {loading && rooms.length === 0 ? (
        <p className="text-muted small">Завантаження кімнат...</p>
      ) : (
        <ul className="list-unstyled chat-list mb-0">
          {rooms.map((room) => (
            <RoomListItem
              key={room.id}
              room={room}
              active={room.id === activeRoomId}
              onSelect={onSelectRoom}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
