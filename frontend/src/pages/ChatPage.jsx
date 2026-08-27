import { ChatLayout } from "@widgets/layouts";

export function ChatPage({ login, onLogout }) {
  return <ChatLayout login={login} onLogout={onLogout} />;
}