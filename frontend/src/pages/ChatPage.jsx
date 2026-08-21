import { useState } from "react";
import { ChatLayout } from "@widgets/layouts";
import { SideNav } from "@widgets/side-nav";
import { ChatSidebar } from "@widgets/chat-sidebar";
import { ChatWindow } from "@widgets/chat-window";
import { RoomList } from "@widgets/room-list";
import { useRoomsStore } from "@entities/room";
import { isMobileViewport } from "@shared/lib/viewport.js";

export function ChatPage({ user, onLogout }) {
  const rooms = useRoomsStore((s) => s.rooms);
  const activeRoomId = useRoomsStore((s) => s.activeRoomId);
  const selectRoom = useRoomsStore((s) => s.selectRoom);

  const activeRoom = rooms.find((room) => room.id === activeRoomId);

  // Список комнат рендерится внутри user-profile-sidebar (см. roomsContent
  // ниже), поэтому открытость этой панели поднята сюда — ей нужно управлять
  // и снаружи (кнопка "Кімнати" в шапке ChatWindow), и изнутри (выбор
  // комнаты в самом списке).
  const [isRoomsOpen, setIsRoomsOpen] = useState(false);
  const openRooms = () => setIsRoomsOpen(true);
  const closeRooms = () => setIsRoomsOpen(false);

  // Выбор комнаты в списке. На мобильном панель — полноэкранная и
  // перекрывает чат, поэтому после выбора её нужно сразу закрыть, чтобы
  // увидеть открывшуюся комнату. На десктопе панель — просто узкая
  // колонка сбоку, чат остаётся виден и под ней, так что закрывать её
  // при переходе не нужно — пусть остаётся открытой, пока пользователь
  // сам её не закроет.
  const handleSelectRoom = (roomId) => {
    selectRoom(roomId);
    if (isMobileViewport()) {
      closeRooms();
    }
  };

  return (
    <ChatLayout
      sideNav={<SideNav />}
      sidebar={
        <ChatSidebar>
          <div
            className="tab-pane active"
            id="pills-users"
            role="tabpanel"
            aria-labelledby="pills-users-tab"
          >
            Ви увійшли як <span className="own-nick">{user.login}</span>
          </div>

          <div
            className="tab-pane"
            id="pills-private-chat"
            role="tabpanel"
            aria-labelledby="pills-private-chat-tab"
          >
            Приватні чати у розробці
          </div>
        </ChatSidebar>
      }
      chatWindow={
        <ChatWindow
          roomId={activeRoomId}
          roomName={activeRoom?.name}
          currentUserId={user.id}
          onBack={() => selectRoom(null)}
          onLogout={onLogout}
        />
      }
      isRoomsOpen={isRoomsOpen}
      onOpenRooms={openRooms}
      onCloseRooms={closeRooms}
      roomsContent={
        <RoomList activeRoomId={activeRoomId} onSelectRoom={handleSelectRoom} />
      }
    />
  );
}