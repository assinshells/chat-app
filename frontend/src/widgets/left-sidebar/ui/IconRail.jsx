import { useRef } from "react";

/**
 * IconRail — навігація іконками-табами. На десктопі вертикальна рейка
 * зліва (іконки по центру висоти), на телефоні — горизонтальна панель
 * внизу (див. layout/_left-sidebar.css). Реалізує WAI-ARIA tabs:
 * стрілки переміщують фокус і активують вкладку, Home/End — перша/остання.
 * tab.badge — необов'язковий лічильник на іконці.
 */
export function IconRail({ tabs, activeTab, onChange }) {
  const buttonsRef = useRef([]);

  const handleKeyDown = (e, index) => {
    let next = null;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      next = (index + 1) % tabs.length;
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      next = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next === null) return;

    e.preventDefault();
    onChange(tabs[next].id);
    buttonsRef.current[next]?.focus();
  };

  return (
    <nav className="icon-rail" aria-label="Навігація">
      <div className="icon-rail-tabs" role="tablist">
        {tabs.map(({ id, label, Icon, badge, badgeClass }, index) => {
          const isActive = id === activeTab;
          return (
            <button
              key={id}
              ref={(el) => {
                buttonsRef.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`left-tab-${id}`}
              aria-selected={isActive}
              aria-controls={`left-tabpanel-${id}`}
              tabIndex={isActive ? 0 : -1}
              className={`icon-rail-btn${isActive ? " is-active" : ""}`}
              title={label}
              aria-label={label}
              onClick={() => onChange(id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              <Icon size={20} />
              {badge > 0 && (
                <span className={`icon-rail-badge badge ${badgeClass ?? "bg-danger"}`}>
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
