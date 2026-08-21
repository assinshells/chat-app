import { useEffect } from "react";
import SimpleBar from "simplebar-react";
import { useRoomsStore, RoomListItem } from "@entities/room";
import { SocketClient } from "@shared/lib/socket.js";
import { SOCKET_EVENTS } from "@shared/constants/socket.constants.js";

/**
 * RoomList — список статических комнат (backend/src/constants/rooms.data.js).
 * Рендерится внутри user-profile-sidebar (см. pages/ChatPage.jsx —
 * roomsContent), открываемой кнопкой "Кімнати" в шапке ChatWindow.
 * Создания комнат нет — список фиксированный, поэтому виджет — просто
 * загрузка + рендер, без формы.
 *
 * onSelectRoom, приходящий из ChatPage, помимо выбора комнаты в сторе,
 * закрывает саму панель — но только на мобильном (на десктопе панель
 * остаётся открытой после выбора, см. handleSelectRoom в ChatPage).
 *
 * Список комнат может быть длиннее видимой области сайдбара, поэтому
 * прокручиваемая часть обёрнута в SimpleBar (тот же паттерн, что и
 * лента сообщений в ChatWindow) — собственный скролл вместо
 * системного, стилизованный под общий шаблон.
 *
 * Подписка на SOCKET_EVENTS.ROOM_USER_COUNTS живёт здесь, а не в
 * useChatSession — счётчики нужны сразу при открытии вкладки Rooms,
 * до того как пользователь выберет (и тем самым присоединится к)
 * какую-либо конкретную комнату.
 */
export function RoomList({ activeRoomId, onSelectRoom }) {
  const rooms = useRoomsStore((s) => s.rooms);
  const loading = useRoomsStore((s) => s.loading);
  const error = useRoomsStore((s) => s.error);
  const loadRooms = useRoomsStore((s) => s.loadRooms);
  const userCounts = useRoomsStore((s) => s.userCounts);
  const setUserCounts = useRoomsStore((s) => s.setUserCounts);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    const socket = SocketClient.connect();

    const handleUserCounts = (counts) => setUserCounts(counts);
    socket.on(SOCKET_EVENTS.ROOM_USER_COUNTS, handleUserCounts);

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_USER_COUNTS, handleUserCounts);
    };
  }, [setUserCounts]);

  return (
    <>
      <div className="p-4">
        <h4 className="mb-4">Кімнати</h4>
        {error && <p className="text-danger small mb-2">{error}</p>}
      </div>
      {loading && rooms.length === 0 ? (
        <p className="text-muted small">Завантаження кімнат...</p>
      ) : (
        <SimpleBar className="p-4 chat-message-list chat-group-list">
          <ul className="list-unstyled chat-list mb-0">
            {rooms.map((room) => (
              <RoomListItem
                key={room.id}
                room={room}
                active={room.id === activeRoomId}
                onSelect={onSelectRoom}
                userCount={userCounts[room.id] ?? 0}
              />
            ))}
          </ul>
        </SimpleBar>
      )}
    </>
  );
}