import { useEffect } from "react";
import {
  Bell,
  Construction,
  Images,
  MessageSquare,
  Settings,
  User,
  Users,
} from "lucide-react";

import { LEFT_TABS, useLeftSidebarStore } from "@shared/lib/leftSidebarStore.js";
import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { useGalleryReviewStore } from "@shared/lib/galleryReviewStore.js";
import { DmHeaderButton } from "@features/dm";
import {
  UsersPanel,
  ProfilePanel,
  SettingsPanel,
  CommonGalleryPanel,
} from "@widgets/side-panel";
import { IconRail } from "./IconRail.jsx";
import { ChatsPanel } from "./ChatsPanel.jsx";

/**
 * LeftSidebar — навігація застосунку: рейка з іконками (IconRail) +
 * сайдбар із вмістом активної вкладки:
 *  Чати (кімнати), Користувачі, Фотогалерея,
 *  Сповіщення (заглушка), Профіль, Налаштування.
 * Десктоп: рейка зліва по центру висоти. Телефон: рейка горизонтально
 * внизу, а коли відкрито чат — усе це сховано (див. .is-chat-open).
 * На телефоні в шапці сайдбара є іконка особистих повідомлень (у
 * списку немає шапки чату з такою іконкою).
 */
export function LeftSidebar({
  login,
  users,
  activeRoom,
  activeRoomName,
  roomCounts,
  selectedNicknames,
  onSelectRoom,
  onNicknameClick,
  currentUserStatus,
  onStatusChange,
  onColorChange,
  onTextStyleChange,
  logoutModalId,
}) {
  const activeTab = useLeftSidebarStore((state) => state.activeTab);
  const setActiveTab = useLeftSidebarStore((state) => state.setActiveTab);

  // Бейдж "чекає перевірки" — лише для тих, хто перевіряє. Оновлюємо при
  // монтуванні та щоразу, як галерею відкрили/закрили (дешевий запит).
  const canReviewPhotos = useCurrentUserStore((state) => state.canReviewPhotos);
  const pendingPhotos = useGalleryReviewStore((state) => state.pendingCount);
  const refreshPendingPhotos = useGalleryReviewStore((state) => state.refresh);
  const isGalleryOpen = activeTab === LEFT_TABS.GALLERY;

  useEffect(() => {
    if (canReviewPhotos) refreshPendingPhotos();
  }, [canReviewPhotos, isGalleryOpen, refreshPendingPhotos]);

  const tabs = [
    { id: LEFT_TABS.CHATS, label: "Чати", Icon: MessageSquare },
    { id: LEFT_TABS.USERS, label: "Користувачі", Icon: Users },
    {
      id: LEFT_TABS.GALLERY,
      label: "Фотогалерея",
      Icon: Images,
      badge: canReviewPhotos ? pendingPhotos : 0,
    },
    { id: LEFT_TABS.NOTIFICATIONS, label: "Сповіщення", Icon: Bell },
    { id: LEFT_TABS.PROFILE, label: "Профіль", Icon: User },
    { id: LEFT_TABS.SETTINGS, label: "Налаштування", Icon: Settings },
  ];

  const current = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  let title = current.label;
  if (current.id === LEFT_TABS.USERS) {
    title = `У кімнаті${activeRoomName ? ` «${activeRoomName}»` : ""}: ${users.length}`;
  }

  let content;
  switch (current.id) {
    case LEFT_TABS.CHATS:
      content = (
        <ChatsPanel
          activeRoom={activeRoom}
          roomCounts={roomCounts}
          onSelectRoom={onSelectRoom}
        />
      );
      break;
    case LEFT_TABS.USERS:
      content = (
        <UsersPanel
          login={login}
          users={users}
          selectedNicknames={selectedNicknames}
          onNicknameClick={onNicknameClick}
        />
      );
      break;
    case LEFT_TABS.GALLERY:
      content = <CommonGalleryPanel />;
      break;
    case LEFT_TABS.PROFILE:
      content = (
        <ProfilePanel
          currentUserStatus={currentUserStatus}
          onStatusChange={onStatusChange}
          logoutModalId={logoutModalId}
        />
      );
      break;
    case LEFT_TABS.SETTINGS:
      content = (
        <SettingsPanel
          onColorChange={onColorChange}
          onTextStyleChange={onTextStyleChange}
        />
      );
      break;
    default:
      content = (
        <div className="left-sidebar-placeholder">
          <Construction size={32} />
          <p className="mb-0">У розробці</p>
        </div>
      );
  }

  return (
    <div className="left-sidebar-wrap">
      <IconRail tabs={tabs} activeTab={current.id} onChange={setActiveTab} />

      <aside className="left-sidebar">
        <div className="left-sidebar-header">
          <h5 className="left-sidebar-title">{title}</h5>
          <DmHeaderButton className="left-sidebar-dm" />
        </div>

        <div
          className="left-sidebar-body"
          role="tabpanel"
          id={`left-tabpanel-${current.id}`}
          aria-labelledby={`left-tab-${current.id}`}
        >
          {content}
        </div>
      </aside>
    </div>
  );
}
