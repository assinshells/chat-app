import { Images, LogOut, Settings, Users } from "lucide-react";

import { DmHeaderButton } from "@features/dm";
import { useAppModalStore } from "@shared/lib/appModalStore.js";
import { useCurrentUserStore } from "@shared/lib/currentUserStore.js";
import { useGalleryReviewStore } from "@shared/lib/galleryReviewStore.js";
import { useRightSidebarStore } from "@shared/lib/rightSidebarStore.js";

/**
 * HeaderActions — іконки модалок у шапці: особисті повідомлення,
 * фотогалерея (з бейджем "чекає перевірки" для тих, хто перевіряє),
 * налаштування і — останньою — вихід (відкриває модалку підтвердження
 * logoutModalId). На телефоні першою додається іконка, що висуває
 * правий сайдбар з кімнатами й користувачами (на десктопі він завжди
 * видно, тож іконка схована).
 */
export function HeaderActions({ className = "", logoutModalId }) {
  const sidebarOpen = useRightSidebarStore((state) => state.mobileOpen);
  const toggleSidebar = useRightSidebarStore((state) => state.toggleMobile);

  const galleryOpen = useAppModalStore((state) => state.galleryOpen);
  const settingsOpen = useAppModalStore((state) => state.settingsOpen);
  const openGallery = useAppModalStore((state) => state.openGallery);
  const openSettings = useAppModalStore((state) => state.openSettings);

  const canReviewPhotos = useCurrentUserStore((state) => state.canReviewPhotos);
  const pendingPhotos = useGalleryReviewStore((state) => state.pendingCount);
  const badge = canReviewPhotos ? pendingPhotos : 0;

  return (
    <div className={`chat-header-actions ${className}`.trim()}>
      <button
        type="button"
        className={`chat-header-btn chat-header-sidebar-toggle d-lg-none${sidebarOpen ? " is-active" : ""}`}
        title="Кімнати і користувачі"
        aria-label="Кімнати і користувачі"
        aria-expanded={sidebarOpen}
        onClick={toggleSidebar}
      >
        <Users size={20} />
      </button>

      <DmHeaderButton />

      <button
        type="button"
        className={`chat-header-btn chat-header-gallery${galleryOpen ? " is-active" : ""}`}
        title="Фотогалерея"
        aria-label={badge > 0 ? `Фотогалерея, на перевірці: ${badge}` : "Фотогалерея"}
        aria-haspopup="dialog"
        onClick={openGallery}
      >
        <Images size={20} />
        {badge > 0 && (
          <span className="chat-header-badge badge rounded-pill bg-danger">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </button>

      <button
        type="button"
        className={`chat-header-btn${settingsOpen ? " is-active" : ""}`}
        title="Налаштування"
        aria-label="Налаштування"
        aria-haspopup="dialog"
        onClick={openSettings}
      >
        <Settings size={20} />
      </button>

      {logoutModalId && (
        <button
          type="button"
          className="chat-header-btn chat-header-btn-logout"
          title="Вийти"
          aria-label="Вийти"
          aria-haspopup="dialog"
          data-bs-toggle="modal"
          data-bs-target={`#${logoutModalId}`}
        >
          <LogOut size={20} />
        </button>
      )}
    </div>
  );
}
