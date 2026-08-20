import { ChatLayout } from "@widgets/layouts";
import { SideNav } from "@widgets/side-nav";
import { ChatSidebar } from "@widgets/chat-sidebar";
import { ChatWindow } from "@widgets/chat-window";
import { RoomList } from "@widgets/room-list";
import { useRoomsStore } from "@entities/room";

export function ChatPage({ user, onLogout }) {
  const rooms = useRoomsStore((s) => s.rooms);
  const activeRoomId = useRoomsStore((s) => s.activeRoomId);
  const selectRoom = useRoomsStore((s) => s.selectRoom);

  const activeRoom = rooms.find((room) => room.id === activeRoomId);

  return (
    <ChatLayout
      sideNav={<SideNav onLogout={onLogout} />}
      sidebar={
        <ChatSidebar>
          <div
            className="tab-pane"
            id="pills-users"
            role="tabpanel"
            aria-labelledby="pills-users-tab"
          >
            Ви увійшли як {user.login}
          </div>

          <div
            className="tab-pane active"
            id="pills-rooms"
            role="tabpanel"
            aria-labelledby="pills-rooms-tab"
          >
            <RoomList activeRoomId={activeRoomId} onSelectRoom={selectRoom} />
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
        />
      }
    />
  );
}