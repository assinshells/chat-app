import { useEffect, useState } from "react";

import { ChatHeader } from "@widgets/chat-header";
import { ChatConversation } from "@widgets/chat-conversation";
import { ChatComposer } from "@widgets/chat-composer";
import { Sidebar } from "@widgets/sidebar";
import { useChatSocket } from "@features/chat";
import { DirectMessagesModal, useDmStore } from "@features/dm";
import { ROOMS_BY_ID } from "@features/chat/constants/rooms.constants.js";

// Скільки ніків/міток часу можна одночасно прикріпити до повідомлення
// через клік по ніку/часу в ChatConversation.
const MAX_TARGETS = 3;

export function ChatLayout({ login, initialRoom, onLogout }) {
  // useDmStore потрібен свій логін, щоб за вхідним dm:new {sender,
  // recipient} розуміти, хто тут "співрозмовник" (див. _handleIncoming).
  useEffect(() => {
    useDmStore.getState().setCurrentUser(login);
  }, [login]);

  const {
    activeRoom,
    switchRoom,
    messages,
    connected,
    roomCounts,
    roomUsers,
    sendMessage,
    cooldownMs,
  } = useChatSocket({
    enabled: Boolean(login),
    initialRoom,
  });

  // pinned — сайдбар закріплений і видимий на десктопі (за замовчуванням — так).
  const [pinned, setPinned] = useState(true);
  // hovering — тимчасовий показ згорнутого сайдбара при наведенні на іконку в шапці.
  const [hovering, setHovering] = useState(false);
  // mobileOpen — висувний drawer на мобільних пристроях (за замовчуванням згорнутий).
  const [mobileOpen, setMobileOpen] = useState(false);

  // targetNicknames / targetTimes — "цілі" повідомлення, зібрані кліками
  // по ніку/часу в ChatConversation, до MAX_TARGETS кожного. Живуть
  // тут, а не в ChatComposer, тому що заповнюються з сусіднього
  // компонента (ChatConversation) — спільний стан двох "дітей".
  const [targetNicknames, setTargetNicknames] = useState([]);
  const [targetTimes, setTargetTimes] = useState([]);

  const sidebarCollapsed = !pinned;
  const previewOpen = sidebarCollapsed && hovering;

  const activeRoomName = ROOMS_BY_ID[activeRoom]?.name;

  const handleSelectRoom = (roomId) => {
    switchRoom(roomId);
    // На мобільному вибір кімнати в drawer'і повинен одразу його закривати —
    // інакше список кімнат перекриває чат, що відкрився.
    setMobileOpen(false);
    // Ніки/час обиралися з повідомлень поточної кімнати — при переході
    // в іншу кімнату вони втрачають сенс.
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

  // Відновлює цілі, якщо відправлення повідомлення не вдалося (ChatComposer
  // вже встиг оптимістично очистити їх перед відправленням).
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
            onRoomClick={handleSelectRoom}
            selectedNicknames={targetNicknames}
            selectedTimes={targetTimes}
            roomUsers={roomUsers}
          />
          <ChatComposer
            onSend={sendMessage}
            cooldownMs={cooldownMs}
            targetNicknames={targetNicknames}
            targetTimes={targetTimes}
            onRemoveNickname={handleRemoveNickname}
            onRemoveTime={handleRemoveTime}
            onClearTargets={handleClearTargets}
            onRestoreTargets={handleRestoreTargets}
          />
        </div>
      </div>

      <DirectMessagesModal />
    </div>
  );
}