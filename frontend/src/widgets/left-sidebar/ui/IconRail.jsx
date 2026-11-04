import { Hash, Users } from "lucide-react";

import { LEFT_TABS } from "@shared/lib/leftSidebarStore.js";

const RAIL_ITEMS = [
  { id: LEFT_TABS.ROOMS, label: "Кімнати", Icon: Hash },
  { id: LEFT_TABS.USERS, label: "Учасники кімнати", Icon: Users },
];

/**
 * IconRail — вузька вертикальна рейка на всю висоту зліва.
 *
 * Іконки — вертикальні pill-таби (role="tablist"), які перемикають
 * вміст LeftSidebar. Розташування: рейка поділена навпіл, іконки
 * починаються від середини висоти й ідуть униз.
 */
export function IconRail({ activeTab, onSelect, usersCount = 0 }) {
  return (
    <nav className="icon-rail" aria-label="Навігація чату">
      <div className="icon-rail-top" />

      <div
        className="icon-rail-tabs nav nav-pills flex-column"
        role="tablist"
        aria-orientation="vertical"
      >
        {RAIL_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`left-tab-${id}`}
              aria-selected={isActive}
              aria-controls={`left-pane-${id}`}
              className={`icon-rail-pill nav-link ${isActive ? "active" : ""}`}
              title={label}
              aria-label={label}
              onClick={() => onSelect(id)}
            >
              <Icon size={20} />
              {id === LEFT_TABS.USERS && usersCount > 0 && (
                <span className="icon-rail-badge">
                  {usersCount > 99 ? "99+" : usersCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
