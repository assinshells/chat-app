import { ChatLayout } from "@widgets/layouts";

export function ChatPage({ login, onLogout }) {
  return (
    <ChatLayout
      onLogout={onLogout}
      sidebarContent={
        <>
          <div
            className="tab-pane"
            id="pills-users"
            role="tabpanel"
            aria-labelledby="pills-users-tab"
          >
            Ви увійшли як {login}
          </div>

          <div
            className="tab-pane active"
            id="pills-rooms"
            role="tabpanel"
            aria-labelledby="pills-rooms-tab"
          >
            Rooms
          </div>

          <div
            className="tab-pane"
            id="pills-private-chat"
            role="tabpanel"
            aria-labelledby="pills-private-chat-tab"
          >
            PrivateChat
          </div>
        </>
      }
      mainContent="User chat"
    />
  );
}