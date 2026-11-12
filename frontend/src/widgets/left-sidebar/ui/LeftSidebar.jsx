import { Home, MessageSquare, Star, Bell, Settings, Construction } from "lucide-react";

import { LEFT_TABS, useLeftSidebarStore } from "@shared/lib/leftSidebarStore.js";
import { IconRail } from "./IconRail.jsx";

const TABS = [
  { id: LEFT_TABS.HOME, label: "Головна", Icon: Home },
  { id: LEFT_TABS.CHATS, label: "Чати", Icon: MessageSquare },
  { id: LEFT_TABS.FAVORITES, label: "Обране", Icon: Star },
  { id: LEFT_TABS.NOTIFICATIONS, label: "Сповіщення", Icon: Bell },
  { id: LEFT_TABS.SETTINGS, label: "Налаштування", Icon: Settings },
];

/**
 * LeftSidebar — ліва рейка з іконками (IconRail) + звичайний сайдбар
 * поруч, обидва на всю висоту. Вибір іконки в рейці перемикає вміст
 * сайдбара; поки що кожна вкладка — заглушка "У розробці".
 */
export function LeftSidebar() {
  const activeTab = useLeftSidebarStore((state) => state.activeTab);
  const setActiveTab = useLeftSidebarStore((state) => state.setActiveTab);

  const current = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  return (
    <div className="left-sidebar-wrap">
      <IconRail tabs={TABS} activeTab={current.id} onChange={setActiveTab} />

      <aside className="left-sidebar">
        <div className="left-sidebar-header">
          <h5 className="left-sidebar-title">{current.label}</h5>
        </div>

        <div
          className="left-sidebar-body"
          role="tabpanel"
          id={`left-tabpanel-${current.id}`}
          aria-labelledby={`left-tab-${current.id}`}
        >
          <div className="left-sidebar-placeholder">
            <Construction size={32} />
            <p className="mb-0">У розробці</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
