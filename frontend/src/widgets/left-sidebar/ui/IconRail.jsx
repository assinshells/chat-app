import { useRef } from "react";

/**
 * IconRail — вузька ліва рейка на всю висоту з іконками-табами.
 * Реалізує WAI-ARIA tabs (вертикальні): стрілки ↑/↓ переміщують фокус
 * і активують вкладку, Home/End — перша/остання.
 */
export function IconRail({ tabs, activeTab, onChange }) {
  const buttonsRef = useRef([]);

  const handleKeyDown = (e, index) => {
    let next = null;
    if (e.key === "ArrowDown") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next === null) return;

    e.preventDefault();
    onChange(tabs[next].id);
    buttonsRef.current[next]?.focus();
  };

  return (
    <nav className="icon-rail" aria-label="Навігація">
      <div
        className="icon-rail-tabs"
        role="tablist"
        aria-orientation="vertical"
      >
        {tabs.map(({ id, label, Icon }, index) => {
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}
