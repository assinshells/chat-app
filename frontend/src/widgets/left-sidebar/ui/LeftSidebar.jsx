import { Bell, Construction, MessageSquare, User } from "lucide-react";

import { LEFT_TABS, useLeftSidebarStore } from "@shared/lib/leftSidebarStore.js";
import { HeaderActions } from "@widgets/chat-header";
import { ProfilePanel } from "@widgets/side-panel";
import { IconRail } from "./IconRail.jsx";

/**
 * LeftSidebar — навігація застосунку: рейка з іконками (IconRail) +
 * сайдбар із вмістом активної вкладки: Профіль, Сповіщення (заглушка) і —
 * лише на телефоні — Чати (chatsContent: кімнати й користувачі, які на
 * десктопі живуть у правому сайдбарі, див. @widgets/right-sidebar).
 * Особисті повідомлення, фотогалерея й налаштування — модалки з іконок
 * у шапці (HeaderActions).
 * Десктоп: рейка зліва по центру висоти. Телефон: рейка горизонтально
 * внизу, а коли відкрито чат — усе це сховано (див. .is-chat-open).
 * На телефоні в шапці сайдбара дублюються іконки модалок (у списку
 * немає шапки чату з ними).
 */
export function LeftSidebar({
  chatsContent,
  currentUserStatus,
  onStatusChange,
  logoutModalId,
}) {
  const activeTab = useLeftSidebarStore((state) => state.activeTab);
  const setActiveTab = useLeftSidebarStore((state) => state.setActiveTab);

  // "Чати" є лише коли передано chatsContent (телефон).
  const tabs = [
    ...(chatsContent
      ? [{ id: LEFT_TABS.CHATS, label: "Чати", Icon: MessageSquare }]
      : []),
    { id: LEFT_TABS.PROFILE, label: "Профіль", Icon: User },
    { id: LEFT_TABS.NOTIFICATIONS, label: "Сповіщення", Icon: Bell },
  ];

  const current = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const title = current.label;

  let content;
  switch (current.id) {
    case LEFT_TABS.CHATS:
      content = chatsContent;
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
          <HeaderActions className="left-sidebar-actions" />
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
