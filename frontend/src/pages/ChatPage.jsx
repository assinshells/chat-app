import { ChatLayout } from "@widgets/layouts";
import { SideNav } from "@widgets/side-nav";
import { ChatSidebar } from "@widgets/chat-sidebar";
import { ChatWindow } from "@widgets/chat-window";

export function ChatPage({ login, onLogout }) {
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
        </ChatSidebar>
      }
      chatWindow={<ChatWindow>Messages</ChatWindow>}
    />
  );
}