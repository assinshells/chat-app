/**
 * RightSidebar — правий сайдбар (кімнати і користувачі).
 * Десктоп (від 992px): колонка на всю висоту чату, завжди видна.
 * Телефон: схований; висувається справа поверх чату за іконкою в шапці
 * (open — стан із useRightSidebarStore), з затемненням, клік по якому
 * закриває сайдбар (onClose).
 * Вміст (children) — RoomsUsersPanel: вкладки "Кімнати / Користувачі".
 * Обгортка .right-sidebar-wrap — позиціонувальний контекст для панелі
 * профілю іншого користувача (overlay, лише десктоп), яка лягає поверх
 * сайдбара на всю його висоту.
 */
export function RightSidebar({ children, overlay, open = false, onClose }) {
  return (
    <>
      <div className={`right-sidebar-wrap${open ? " is-open" : ""}`}>
        <aside className="right-sidebar" aria-label="Кімнати і користувачі">
          {children}
        </aside>
        {overlay}
      </div>

      {open && (
        <div
          className="right-sidebar-backdrop"
          aria-hidden="true"
          onClick={onClose}
        />
      )}
    </>
  );
}
