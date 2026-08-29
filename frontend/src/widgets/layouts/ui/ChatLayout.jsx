import { useState } from "react";

import { ChatHeader } from "@widgets/chat-header";
import { ChatConversation } from "@widgets/chat-conversation";
import { ChatComposer } from "@widgets/chat-composer";
import { Sidebar } from "@widgets/sidebar";
import { useChatSocket } from "@features/chat";
import { ROOMS_BY_ID } from "@features/chat/constants/rooms.constants.js";

// Сколько ников/меток времени можно одновременно прикрепить к сообщению
// через клик по нику/времени в ChatConversation.
const MAX_TARGETS = 3;

export function ChatLayout({ login, initialRoom, onLogout, selectedUser }) {
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
    initialRoom,
  });

  // pinned — сайдбар закреплён и виден на десктопе (по умолчанию — да).
  const [pinned, setPinned] = useState(true);
  // hovering — временный показ свёрнутого сайдбара при наведении на иконку в шапке.
  const [hovering, setHovering] = useState(false);
  // mobileOpen — выезжающий drawer на мобильных устройствах (по умолчанию свёрнут).
  const [mobileOpen, setMobileOpen] = useState(false);

  // targetNicknames / targetTimes — "цели" сообщения, собранные кликами
  // по нику/времени в ChatConversation, до MAX_TARGETS каждого. Живут
  // здесь, а не в ChatComposer, потому что заполняются из соседнего
  // компонента (ChatConversation) — общее состояние двух "детей".
  const [targetNicknames, setTargetNicknames] = useState([]);
  const [targetTimes, setTargetTimes] = useState([]);

  const sidebarCollapsed = !pinned;
  const previewOpen = sidebarCollapsed && hovering;

  const activeRoomName = ROOMS_BY_ID[activeRoom]?.name;

  const handleSelectRoom = (roomId) => {
    switchRoom(roomId);
    // На мобильном выбор комнаты в drawer'е должен сразу его закрывать —
    // иначе список комнат перекрывает открывшийся чат.
    setMobileOpen(false);
    // Ники/время выбирались из сообщений текущей комнаты — при переходе
    // в другую комнату они теряют смысл.
    setTargetNicknames([]);
    setTargetTimes([]);
  };

  const handleNicknameClick = (nickname) => {
    setTargetNicknames((prev) => {
      if (prev.includes(nickname) || prev.length >= MAX_TARGETS) return prev;
      return [...prev, nickname];
    });
  };

  const handleTimeClick = (time) => {
    setTargetTimes((prev) => {
      if (prev.includes(time) || prev.length >= MAX_TARGETS) return prev;
      return [...prev, time];
    });
  };

  const handleRemoveNickname = (nickname) => {
    setTargetNicknames((prev) => prev.filter((n) => n !== nickname));
  };

  const handleRemoveTime = (time) => {
    setTargetTimes((prev) => prev.filter((t) => t !== time));
  };

  const handleClearTargets = () => {
    setTargetNicknames([]);
    setTargetTimes([]);
  };

  // Восстанавливает цели, если отправка сообщения не удалась (ChatComposer
  // уже успел оптимистично очистить их перед отправкой).
  const handleRestoreTargets = ({ nicknames, times }) => {
    setTargetNicknames(nicknames);
    setTargetTimes(times);
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
        onNicknameClick={handleNicknameClick}
        selectedNicknames={targetNicknames}
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
          <ChatConversation
            messages={messages}
            currentUser={login}
            onNicknameClick={handleNicknameClick}
            onTimeClick={handleTimeClick}
            selectedNicknames={targetNicknames}
            selectedTimes={targetTimes}
            roomUsers={roomUsers}
          />
          <ChatComposer
            selectedUser={selectedUser}
            onSend={sendMessage}
            targetNicknames={targetNicknames}
            targetTimes={targetTimes}
            onRemoveNickname={handleRemoveNickname}
            onRemoveTime={handleRemoveTime}
            onClearTargets={handleClearTargets}
            onRestoreTargets={handleRestoreTargets}
          />
        </div>
      </div>
    </div>
  );
}