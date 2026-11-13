/**
 * RightSidebar — правий сайдбар на всю висоту чату (лише десктоп, від
 * 992px; на телефоні той самий вміст — у вкладці "Чати" лівої рейки).
 * Вміст (children) — RoomsUsersPanel: вкладки "Усі / Кімнати /
 * Користувачі". Обгортка .right-sidebar-wrap — позиціонувальний контекст
 * для панелі профілю іншого користувача (SidePanel), яка при відкритті
 * лягає поверх сайдбара на всю його висоту.
 */
export function RightSidebar({ children, overlay }) {
  return (
    <div className="right-sidebar-wrap">
      <aside className="right-sidebar" aria-label="Кімнати і користувачі">
        {children}
      </aside>
      {overlay}
    </div>
  );
}
