import { ChatLayout } from "@widgets/layouts";

export function ChatPage({ login, initialRoom, onLogout }) {
  return (
    <ChatLayout login={login} initialRoom={initialRoom} onLogout={onLogout} />
  );
}