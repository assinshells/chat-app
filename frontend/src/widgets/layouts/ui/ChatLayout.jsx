import { useState } from "react";

import { ChatHeader } from "@widgets/chat-header";
import { ChatConversation } from "@widgets/chat-conversation";
import { ChatComposer } from "@widgets/chat-composer";
import { Sidebar } from "@widgets/sidebar";
import { useChatSocket } from "@features/chat";
import { ROOMS_BY_ID } from "@features/chat/constants/rooms.constants.js";

export function ChatLayout({ login, onLogout, selectedUser }) {
  const {
    activeRoom,
    switchRoom,
    messages,
    connected,
    roomCounts,
    roomUsers,
    sendMessage,
  } = useChatSocket({
    enabled: Boolean(login),
  });

  // pinned — сайдбар закреплён и виден на десктопе (по умолчанию — да).
  const [pinned, setPinned] = useState(true);
  // hovering — временный показ свёрнутого сайдбара при наведении на иконку в шапке.
  const [hovering, setHovering] = useState(false);
  // mobileOpen — выезжающий drawer на мобильных устройствах (по умолчанию свёрнут).
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarCollapsed = !pinned;
  const previewOpen = sidebarCollapsed && hovering;

  const activeRoomName = ROOMS_BY_ID[activeRoom]?.name;

  const handleSelectRoom = (roomId) => {
    switchRoom(roomId);
    // На мобильном выбор комнаты в drawer'е должен сразу его закрывать —
    // иначе список комнат перекрывает открывшийся чат.
    setMobileOpen(false);
  };

  return (
    <div className="layout-wrapper d-lg-flex">
      <Sidebar
        pinned={pinned}
        previewOpen={previewOpen}
        mobileOpen={mobileOpen}
        onPin={() => setPinned(true)}
        onCollapse={() => setPinned(false)}
        onHoverEnter={() => setHovering(true)}
        onHoverLeave={() => setHovering(false)}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={onLogout}
        login={login}
        activeRoom={activeRoom}
        roomCounts={roomCounts}
        roomUsers={roomUsers}
        onSelectRoom={handleSelectRoom}
      />

      {mobileOpen && (
        <div
          className="sidebar-backdrop d-lg-none"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="user-chat w-100">
        <div className="chat-main">
          <ChatHeader
            title={activeRoomName}
            online={connected}
            sidebarCollapsed={sidebarCollapsed}
            onOpenSidebar={() => setPinned(true)}
            onHoverSidebarIcon={() => setHovering(true)}
            onOpenMobileSidebar={() => setMobileOpen(true)}
          />
          <ChatConversation messages={messages} currentUser={login} />
          <ChatComposer selectedUser={selectedUser} onSend={sendMessage} />
        </div>
      </div>
    </div>
  );
}